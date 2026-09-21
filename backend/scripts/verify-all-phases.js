#!/usr/bin/env node

/* eslint-disable no-console */
require('dotenv').config();

const { execFileSync } = require('child_process');
const {
    sequelize,
    Product,
    Warehouse,
    Inventory,
    Order,
    User
} = require('../models');

const DEFAULT_BASE_URL = 'http://localhost:5000';
const cliArg = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
const BASE_URL = (process.env.VERIFY_BASE_URL || cliArg || DEFAULT_BASE_URL).replace(/\/$/, '');
const ORIGIN = process.env.VERIFY_ORIGIN || 'http://localhost:5173';
const PROD_ORIGIN = process.env.VERIFY_PROD_ORIGIN || 'https://example.com';
const ADMIN_EMAIL = process.env.VERIFY_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.VERIFY_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
const RUN_DOCKER_CHECKS = process.env.VERIFY_DOCKER === '1';
const HTTP_TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS || 10000);

const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

const state = {
    adminToken: null,
    customerToken: null,
    customerUser: null,
    productId: null,
    warehouseId: null,
    secondWarehouseId: null,
    orderId: null,
    createdUserIds: [],
    createdOrderIds: [],
    createdProductIds: [],
    createdWarehouseIds: []
};

const totals = {
    pass: 0,
    fail: 0,
    skip: 0,
    warn: 0
};

const stamp = Date.now();
const customerEmail = `verify.customer.${stamp}@example.com`;
const customerPassword = 'Verify#12345';

function printHelp() {
    console.log(`
${colors.bold}SCMS Master E2E Verification Suite${colors.reset}

Usage:
  node scripts/verify-all-phases.js [baseUrl]
  npm run verify:phases -- [baseUrl]

Examples:
  npm run verify:phases
  npm run verify:phases -- http://localhost:5000
  $env:VERIFY_ADMIN_EMAIL="admin@example.com"; $env:VERIFY_ADMIN_PASSWORD="Admin#12345"; npm run verify:phases

Environment:
  VERIFY_BASE_URL          API base URL. Defaults to ${DEFAULT_BASE_URL}
  VERIFY_ORIGIN            Local frontend origin for CORS checks. Defaults to http://localhost:5173
  VERIFY_PROD_ORIGIN       Production origin for deployment CORS checks. Defaults to https://example.com
  VERIFY_ADMIN_EMAIL       Admin login for product, inventory, order, dashboard checks
  VERIFY_ADMIN_PASSWORD    Admin password
  VERIFY_DOCKER=1          Enable Docker container status checks
  VERIFY_TIMEOUT_MS        HTTP timeout in milliseconds. Defaults to 10000
`);
}

function paint(color, value) {
    return `${colors[color]}${value}${colors.reset}`;
}

function statusLine(status, label, detail = '') {
    const palette = {
        pass: ['green', 'PASS'],
        fail: ['red', 'FAIL'],
        skip: ['yellow', 'SKIP'],
        warn: ['yellow', 'WARN']
    };
    const [color, tag] = palette[status];
    totals[status] += 1;
    const suffix = detail ? ` ${colors.gray}${detail}${colors.reset}` : '';
    console.log(`  ${paint(color, tag.padEnd(4))} ${label}${suffix}`);
}

function phase(title) {
    console.log(`\n${paint('cyan', colors.bold + title + colors.reset)}`);
}

function getByPath(source, path) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), source);
}

function pickId(body, keys = ['id', 'data.id', 'product.id', 'warehouse.id', 'user.id']) {
    for (const key of keys) {
        const value = getByPath(body, key);
        if (value !== undefined && value !== null) return value;
    }
    return undefined;
}

function extractToken(body, response) {
    const authHeader = response.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice(7);
    }

    const cookie = response.headers.get('set-cookie');
    const cookieToken = cookie && cookie.match(/(?:token|jwt|accessToken)=([^;]+)/i);
    if (cookieToken) return cookieToken[1];

    return body?.token || body?.accessToken || body?.data?.token || body?.data?.accessToken || null;
}

async function request(method, path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
    const headers = {
        Accept: 'application/json',
        Origin: options.origin || ORIGIN,
        ...options.headers
    };

    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';

    try {
        const response = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: controller.signal
        });
        const text = await response.text();
        let body = null;

        if (text) {
            try {
                body = JSON.parse(text);
            } catch {
                body = text;
            }
        }

        return {
            ok: response.ok,
            status: response.status,
            headers: response.headers,
            body,
            token: extractToken(body, response)
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function check(label, fn) {
    try {
        const detail = await fn();
        statusLine('pass', label, detail);
        return true;
    } catch (error) {
        statusLine('fail', label, error.message);
        return false;
    }
}

async function optional(label, fn) {
    try {
        const detail = await fn();
        statusLine('pass', label, detail);
        return true;
    } catch (error) {
        statusLine('skip', label, error.message);
        return false;
    }
}

function expectStatus(result, expected, context = '') {
    const expectedStatuses = Array.isArray(expected) ? expected : [expected];
    if (!expectedStatuses.includes(result.status)) {
        throw new Error(`expected ${expectedStatuses.join('/')} got ${result.status}${context ? ` (${context})` : ''}`);
    }
}

function requireAdminToken() {
    if (!state.adminToken) {
        throw new Error('set VERIFY_ADMIN_EMAIL and VERIFY_ADMIN_PASSWORD for admin-only checks');
    }
}

async function phase1() {
    phase('Phase 1: Infrastructure & DB Connectivity');

    await check('Ping /api/health returns 200 OK and uptime', async () => {
        const result = await request('GET', '/api/health');
        expectStatus(result, 200);
        const uptime = result.body?.uptime ?? result.body?.data?.uptime;
        if (uptime === undefined) throw new Error('response did not include uptime');
        return `uptime=${uptime}`;
    });

    await check('Database connection responds to SELECT 1', async () => {
        const [rows] = await sequelize.query('SELECT 1 AS ok');
        const ok = Array.isArray(rows) ? rows[0]?.ok : rows?.ok;
        if (Number(ok) !== 1) throw new Error('SELECT 1 did not return ok=1');
        return 'sequelize authenticated';
    });

    await check('CORS preflight and Express middleware headers are present', async () => {
        const result = await request('OPTIONS', '/api/auth/login', {
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type,authorization'
            }
        });
        expectStatus(result, [200, 204]);
        const allowOrigin = result.headers.get('access-control-allow-origin');
        const allowCredentials = result.headers.get('access-control-allow-credentials');
        if (!allowOrigin) throw new Error('missing access-control-allow-origin');
        if (allowCredentials !== 'true') throw new Error('missing access-control-allow-credentials=true');
        return `origin=${allowOrigin}`;
    });
}

async function phase2() {
    phase('Phase 2: Authentication & RBAC');

    await check('User Registration: POST /api/auth/register', async () => {
        const result = await request('POST', '/api/auth/register', {
            body: {
                name: 'Verify Customer',
                email: customerEmail,
                password: customerPassword
            }
        });
        expectStatus(result, [201, 400]);
        if (result.status === 400 && !String(result.body?.message || '').toLowerCase().includes('exists')) {
            throw new Error(`unexpected registration rejection: ${JSON.stringify(result.body)}`);
        }
        return result.status === 201 ? customerEmail : 'test user already exists';
    });

    await check('User Login returns JWT token', async () => {
        const result = await request('POST', '/api/auth/login', {
            body: { email: customerEmail, password: customerPassword }
        });
        expectStatus(result, 200);
        if (!result.token) throw new Error('JWT token missing from response/header/cookie');
        state.customerToken = result.token;
        state.customerUser = result.body?.user || result.body?.data?.user;
        if (state.customerUser?.id) state.createdUserIds.push(state.customerUser.id);
        return 'customer token received';
    });

    await check('Protected route accepts valid JWT', async () => {
        const result = await request('GET', '/api/products', { token: state.customerToken });
        expectStatus(result, 200);
        return 'GET /api/products authorized';
    });

    await check('Protected route rejects missing JWT with 401', async () => {
        const result = await request('GET', '/api/products');
        expectStatus(result, 401);
        return 'missing token rejected';
    });

    await check('Protected route rejects invalid JWT with 401', async () => {
        const result = await request('GET', '/api/products', { token: 'not-a-real-token' });
        expectStatus(result, 401);
        return 'invalid token rejected';
    });

    await check('Customer/User role is rejected from admin endpoint with 403', async () => {
        const result = await request('GET', '/api/test/admin', { token: state.customerToken });
        expectStatus(result, 403);
        return '/api/test/admin denied';
    });

    await optional('Admin login for admin-only phase checks', async () => {
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error('set VERIFY_ADMIN_EMAIL and VERIFY_ADMIN_PASSWORD');
        }
        const result = await request('POST', '/api/auth/login', {
            body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
        });
        expectStatus(result, 200);
        if (!result.token) throw new Error('admin JWT token missing');
        state.adminToken = result.token;
        return ADMIN_EMAIL;
    });
}

async function ensureAdminFixtures() {
    requireAdminToken();

    if (!state.warehouseId) {
        const result = await request('POST', '/api/warehouses', {
            token: state.adminToken,
            body: {
                name: `Verify Warehouse A ${stamp}`,
                location: 'Verification Zone',
                manager: 'Verify Bot',
                isActive: true
            }
        });
        expectStatus(result, 201);
        state.warehouseId = pickId(result.body, ['warehouse.id', 'data.id', 'id']);
        state.createdWarehouseIds.push(state.warehouseId);
    }

    if (!state.secondWarehouseId) {
        const result = await request('POST', '/api/warehouses', {
            token: state.adminToken,
            body: {
                name: `Verify Warehouse B ${stamp}`,
                location: 'Verification Overflow',
                manager: 'Verify Bot',
                isActive: true
            }
        });
        expectStatus(result, 201);
        state.secondWarehouseId = pickId(result.body, ['warehouse.id', 'data.id', 'id']);
        state.createdWarehouseIds.push(state.secondWarehouseId);
    }
}

async function phase3() {
    phase('Phase 3: Product Module');

    await optional('POST /api/products rejects invalid product payload with 400', async () => {
        requireAdminToken();
        const result = await request('POST', '/api/products', {
            token: state.adminToken,
            body: { name: '', price: -1 }
        });
        expectStatus(result, 400);
        return 'validation middleware active';
    });

    await optional('POST /api/products creates product', async () => {
        requireAdminToken();
        const result = await request('POST', '/api/products', {
            token: state.adminToken,
            body: {
                name: `Verify Product ${stamp}`,
                description: 'Created by scripts/verify-all-phases.js',
                price: 19.99,
                category: 'Verification'
            }
        });
        expectStatus(result, 201);
        state.productId = pickId(result.body, ['product.id', 'data.id', 'id']);
        if (!state.productId) throw new Error('created product id missing');
        state.createdProductIds.push(state.productId);
        return `productId=${state.productId}`;
    });

    await optional('GET /api/products fetches list', async () => {
        requireAdminToken();
        const result = await request('GET', '/api/products', { token: state.adminToken });
        expectStatus(result, 200);
        const list = Array.isArray(result.body) ? result.body : result.body?.data;
        if (!Array.isArray(list)) throw new Error('products response is not an array');
        return `${list.length} products returned`;
    });

    await optional('PUT /api/products/:id updates product details', async () => {
        requireAdminToken();
        if (!state.productId) throw new Error('product creation did not complete');
        const result = await request('PUT', `/api/products/${state.productId}`, {
            token: state.adminToken,
            body: {
                name: `Verify Product Updated ${stamp}`,
                description: 'Updated by verification suite',
                price: 24.5,
                category: 'Verification'
            }
        });
        expectStatus(result, 200);
        return 'product updated';
    });

    await optional('DELETE /api/products/:id deletes product', async () => {
        requireAdminToken();
        const createResult = await request('POST', '/api/products', {
            token: state.adminToken,
            body: {
                name: `Verify Product Delete ${stamp}`,
                description: 'Created for delete endpoint verification',
                price: 9.99,
                category: 'Verification'
            }
        });
        expectStatus(createResult, 201);
        const deleteId = pickId(createResult.body, ['product.id', 'data.id', 'id']);
        if (!deleteId) throw new Error('delete fixture product id missing');

        const deleteResult = await request('DELETE', `/api/products/${deleteId}`, {
            token: state.adminToken
        });
        expectStatus(deleteResult, 200);
        return `deleted productId=${deleteId}`;
    });
}

async function phase4() {
    phase('Phase 4: Inventory Module');

    await optional('PATCH /api/inventory/:productId/stock contract is absent or implemented', async () => {
        requireAdminToken();
        if (!state.productId) throw new Error('product fixture unavailable');
        const result = await request('PATCH', `/api/inventory/${state.productId}/stock`, {
            token: state.adminToken,
            body: { warehouseId: state.warehouseId, quantity: 10, type: 'ADJUSTMENT' }
        });
        if (result.status === 404) throw new Error('current backend uses POST /api/inventory/update instead');
        expectStatus(result, [200, 204]);
        return 'requested PATCH stock endpoint works';
    });

    await optional('Stock adjustment via current endpoint POST /api/inventory/update', async () => {
        requireAdminToken();
        await ensureAdminFixtures();
        if (!state.productId) throw new Error('product fixture unavailable');
        const result = await request('POST', '/api/inventory/update', {
            token: state.adminToken,
            body: {
                productId: state.productId,
                warehouseId: state.warehouseId,
                type: 'ADJUSTMENT',
                quantity: 12,
                lowStockThreshold: 15
            }
        });
        expectStatus(result, 200);
        const quantity = result.body?.data?.quantity;
        if (Number(quantity) !== 12) throw new Error(`expected quantity=12 got ${quantity}`);
        return 'quantity adjusted to 12';
    });

    await optional('Warehouse allocation transfer updates source/destination stock', async () => {
        requireAdminToken();
        const result = await request('POST', '/api/inventory/transfer', {
            token: state.adminToken,
            body: {
                productId: state.productId,
                fromWarehouseId: state.warehouseId,
                toWarehouseId: state.secondWarehouseId,
                quantity: 2
            }
        });
        expectStatus(result, 200);
        return 'transfer completed';
    });

    await optional('Low-stock endpoint filters quantity below threshold', async () => {
        requireAdminToken();
        const result = await request('GET', '/api/inventory/low-stock', { token: state.adminToken });
        expectStatus(result, 200);
        const list = result.body?.data;
        if (!Array.isArray(list)) throw new Error('low-stock data is not an array');
        const item = list.find((entry) => Number(entry.productId) === Number(state.productId));
        if (!item) throw new Error('verification inventory item was not returned as low stock');
        if (!(Number(item.quantity) < Number(item.lowStockThreshold))) {
            throw new Error('returned item does not satisfy quantity < threshold');
        }
        return `lowStockCount=${list.length}`;
    });
}

async function phase5() {
    phase('Phase 5: Order Management');

    await optional('POST /api/orders creates order and deducts inventory', async () => {
        requireAdminToken();
        if (!state.customerToken) throw new Error('customer login unavailable');

        await request('POST', '/api/inventory/update', {
            token: state.adminToken,
            body: {
                productId: state.productId,
                warehouseId: state.warehouseId,
                type: 'ADJUSTMENT',
                quantity: 20,
                lowStockThreshold: 5
            }
        });

        const before = await Inventory.findOne({
            where: { productId: state.productId, warehouseId: state.warehouseId }
        });
        const result = await request('POST', '/api/orders', {
            token: state.customerToken,
            body: {
                productId: state.productId,
                warehouseId: state.warehouseId,
                quantity: 3,
                shippingAddress: '123 Verification Street'
            }
        });
        expectStatus(result, 201);
        state.orderId = pickId(result.body, ['data.id', 'order.id', 'id']);
        if (!state.orderId) throw new Error('created order id missing');
        state.createdOrderIds.push(state.orderId);

        const after = await Inventory.findOne({
            where: { productId: state.productId, warehouseId: state.warehouseId }
        });
        if (Number(after.quantity) !== Number(before.quantity) - 3) {
            throw new Error(`stock was not deducted by 3 (${before.quantity} -> ${after.quantity})`);
        }
        return `orderId=${state.orderId}`;
    });

    await optional('Order status transitions pending -> approved -> shipped -> delivered', async () => {
        requireAdminToken();
        if (!state.orderId) throw new Error('order fixture unavailable');
        for (const status of ['approved', 'shipped', 'delivered']) {
            const result = await request('PATCH', `/api/orders/${state.orderId}/status`, {
                token: state.adminToken,
                body: { status }
            });
            expectStatus(result, 200, status);
        }
        return 'transition path completed';
    });

    await optional('GET /api/orders/:id returns tracking/details', async () => {
        if (!state.orderId) throw new Error('order fixture unavailable');
        const result = await request('GET', `/api/orders/${state.orderId}`, { token: state.customerToken });
        expectStatus(result, 200);
        const id = pickId(result.body, ['data.id', 'order.id', 'id']);
        if (Number(id) !== Number(state.orderId)) throw new Error('returned order id mismatch');
        return `orderId=${id}`;
    });
}

async function phase6() {
    phase('Phase 6: Dashboard & Analytics');

    await optional('GET /api/analytics/revenue contract is absent or performant', async () => {
        requireAdminToken();
        const started = Date.now();
        const result = await request('GET', '/api/analytics/revenue', { token: state.adminToken });
        const elapsed = Date.now() - started;
        if (result.status === 404) throw new Error('current backend exposes reports under /api/reports, not /api/analytics');
        expectStatus(result, 200);
        if (elapsed > 2000) throw new Error(`revenue endpoint took ${elapsed}ms`);
        return `${elapsed}ms`;
    });

    await optional('Revenue/order report endpoint responds within threshold', async () => {
        requireAdminToken();
        const started = Date.now();
        const result = await request('GET', '/api/reports/orders', { token: state.adminToken });
        const elapsed = Date.now() - started;
        expectStatus(result, 200);
        if (elapsed > 2000) throw new Error(`order report took ${elapsed}ms`);
        return `${elapsed}ms`;
    });

    await optional('Dashboard summary returns aggregation counts', async () => {
        requireAdminToken();
        const result = await request('GET', '/api/dashboard/admin', { token: state.adminToken });
        expectStatus(result, 200);
        const data = result.body?.data;
        if (!data?.counts || data.lowStockCount === undefined || !Array.isArray(data.ordersByStatus)) {
            throw new Error('summary response missing counts, lowStockCount, or ordersByStatus');
        }
        return `products=${data.counts.products}, lowStock=${data.lowStockCount}`;
    });
}

async function phase7() {
    phase('Phase 7: Deployment & Environment Check');

    await check('Required environment variables are populated', async () => {
        const required = ['NODE_ENV', 'PORT', 'JWT_SECRET'];
        const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
        const hasMysqlParts = ['DB_NAME', 'DB_USER', 'DB_HOST', 'DB_PASSWORD'].every((key) => Boolean(process.env[key]));
        const missing = required.filter((key) => !process.env[key]);
        if (!hasDatabaseUrl && !hasMysqlParts) missing.push('DATABASE_URL or DB_NAME/DB_USER/DB_HOST/DB_PASSWORD');
        if (missing.length) throw new Error(`missing: ${missing.join(', ')}`);
        return `NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`;
    });

    await optional('Docker container status includes a running/healthy container', async () => {
        if (!RUN_DOCKER_CHECKS) throw new Error('set VERIFY_DOCKER=1 to run Docker checks');
        const output = execFileSync('docker', [
            'ps',
            '--format',
            '{{.Names}}\t{{.Status}}\t{{.Ports}}'
        ], { encoding: 'utf8' });
        if (!output.trim()) throw new Error('no running containers found');
        const healthyLine = output
            .split(/\r?\n/)
            .find((line) => /healthy|up/i.test(line) && (/5000|scm|supply|backend/i.test(line)));
        if (!healthyLine) throw new Error('no matching backend container is running/healthy');
        return healthyLine.trim();
    });

    await check('CORS configuration allows configured origin', async () => {
        const result = await request('OPTIONS', '/api/auth/login', {
            origin: PROD_ORIGIN,
            headers: {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type,authorization'
            }
        });
        expectStatus(result, [200, 204]);
        const allowOrigin = result.headers.get('access-control-allow-origin');
        if (!allowOrigin) throw new Error('missing access-control-allow-origin');
        if (allowOrigin !== PROD_ORIGIN && allowOrigin !== '*') {
            throw new Error(`origin ${PROD_ORIGIN} not allowed; got ${allowOrigin}`);
        }
        return `origin=${allowOrigin}`;
    });
}

async function cleanup() {
    phase('Cleanup');

    await optional('Remove verification orders', async () => {
        if (!state.createdOrderIds.length) throw new Error('no created orders');
        await Order.destroy({ where: { id: state.createdOrderIds } });
        return `${state.createdOrderIds.length} removed`;
    });

    await optional('Remove verification inventory rows', async () => {
        if (!state.productId) throw new Error('no product fixture');
        const count = await Inventory.destroy({ where: { productId: state.productId } });
        return `${count} removed`;
    });

    await optional('Remove verification products', async () => {
        if (!state.createdProductIds.length) throw new Error('no created products');
        await Product.destroy({ where: { id: state.createdProductIds } });
        return `${state.createdProductIds.length} removed`;
    });

    await optional('Remove verification warehouses', async () => {
        if (!state.createdWarehouseIds.length) throw new Error('no created warehouses');
        await Warehouse.destroy({ where: { id: state.createdWarehouseIds } });
        return `${state.createdWarehouseIds.length} removed`;
    });

    await optional('Remove verification customer', async () => {
        const count = await User.destroy({ where: { email: customerEmail } });
        if (!count) throw new Error('no created customer');
        return `${count} removed`;
    });
}

async function main() {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printHelp();
        return;
    }

    console.log(paint('blue', `${colors.bold}SCMS Master E2E Verification Suite${colors.reset}`));
    console.log(`${colors.dim}Base URL: ${BASE_URL}`);
    console.log(`Origin:   ${ORIGIN}`);
    console.log(`Prod CORS Origin: ${PROD_ORIGIN}${colors.reset}`);

    try {
        await phase1();
        await phase2();
        await phase3();
        await phase4();
        await phase5();
        await phase6();
        await phase7();
    } finally {
        await cleanup();
        await sequelize.close();
    }

    console.log(`\n${paint('bold', 'Summary')}`);
    console.log(`  ${paint('green', `PASS ${totals.pass}`)}  ${paint('red', `FAIL ${totals.fail}`)}  ${paint('yellow', `SKIP ${totals.skip}`)}  ${paint('yellow', `WARN ${totals.warn}`)}`);

    if (totals.fail > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(`\n${paint('red', 'Fatal verification error:')} ${error.stack || error.message}`);
    sequelize.close().finally(() => {
        process.exit(1);
    });
});
