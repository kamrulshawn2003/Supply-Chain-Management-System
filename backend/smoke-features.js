// Smoke test for the new SCMS backend features (Purchase Orders, Returns, Notifications, Order Cancel)
// Run from the backend directory: node smoke-features.js
const BASE = 'http://localhost:5000/api';

async function api(method, path, token, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { json = text; }
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
    return json;
}

const ok = (label, actual, expected) => {
    const pass = actual === expected;
    console.log(`${pass ? 'PASS' : 'FAIL'} | ${label}: got=${actual} expected=${expected}`);
    if (!pass) process.exitCode = 1;
};

(async () => {
    const admin = (await api('POST', '/auth/login', null, { email: 'scms.test.admin@example.com', password: 'Test#12345' })).token;
    const cust = (await api('POST', '/auth/login', null, { email: 'scms.test.customer@example.com', password: 'Test#12345' })).token;
    console.log('tokens OK');

    // 1. Purchase order list
    const poList = (await api('GET', '/purchase-orders', admin)).data;
    console.log(`PO list: ${poList.length} purchase orders`);
    const po = poList.find((p) => p.poNumber === 'PO-1789987180056');
    if (!po) throw new Error('Expected PO #2 not found in list');
    ok('PO#2 initial status', po.status, 'pending');

    // 2. Approve + receive
    const approved = (await api('PATCH', `/purchase-orders/${po.id}/approve`, admin)).data;
    ok('PO#2 approved', approved.status, 'approved');
    const received = (await api('POST', `/purchase-orders/${po.id}/receive`, admin)).data;
    ok('PO#2 received', received.status, 'received');
    ok('PO#2 receivedAt set', received.receivedAt ? 'yes' : 'no', 'yes');

    // 3. Inventory increased by 10 (Laptop productId=2, warehouse 1)
    const inv = (await api('GET', '/inventory?warehouseId=1', admin)).data;
    const laptop = inv.find((i) => i.productId === 2);
    ok('Laptop qty after PO receive', laptop.quantity, 125);

    // 4. Order #5 -> delivered
    for (const st of ['approved', 'shipped', 'delivered']) {
        const r = (await api('PATCH', '/orders/5/status', admin, { status: st })).data;
        ok(`order 5 -> ${st}`, r.status, st);
    }

    // 5. Customer return
    const ret = (await api('POST', '/returns', cust, { orderId: 5, productId: 2, quantity: 1, reason: 'Defective unit' })).data;
    ok('return created', ret.status, 'pending');
    const retId = ret.id;
    const retList = (await api('GET', '/returns', admin)).data;
    ok('returns visible to admin', retList.length >= 1, true);
    const handled = (await api('PATCH', `/returns/${retId}`, admin, { status: 'approved' })).data;
    ok('return approved', handled.status, 'approved');
    const inv2 = (await api('GET', '/inventory?warehouseId=1', admin)).data;
    const laptop2 = inv2.find((i) => i.productId === 2);
    ok('Laptop qty after return approved', laptop2.quantity, 126);

    // 6. Create + cancel order
    const o6 = (await api('POST', '/orders', cust, { productId: 2, warehouseId: 1, quantity: 1, shippingAddress: 'Cancel test addr' })).data;
    ok('order #6 created', o6.status, 'pending');
    const c6 = (await api('POST', `/orders/${o6.id}/cancel`, cust)).data;
    ok('order #6 cancelled', c6.status, 'cancelled');
    const inv3 = (await api('GET', '/inventory?warehouseId=1', admin)).data;
    const laptop3 = inv3.find((i) => i.productId === 2);
    ok('Laptop qty after cancel restock', laptop3.quantity, 126);

    // 7. Notifications
    const nA = (await api('GET', '/notifications', admin)).data;
    const nC = (await api('GET', '/notifications', cust)).data;
    const uc = (await api('GET', '/notifications/unread-count', cust)).data;
    ok('admin notifications exist', nA.length >= 1, true);
    ok('customer notifications exist', nC.length >= 3, true);
    ok('customer unread count matches list', uc.count, nC.filter((n) => !n.read).length);
    const types = [...new Set(nC.map((n) => n.type))].join(',');
    console.log(`customer notification types: ${types}`);
    await api('PATCH', `/notifications/${nC[0].id}/read`, cust);
    const uc2 = (await api('GET', '/notifications/unread-count', cust)).data;
    ok('unread decreased after mark-read', uc2.count, uc.count - 1);

    // 8. Cancel leftover pending PO #1 if present
    const p1 = poList.find((p) => p.id === 1);
    if (p1 && p1.status === 'pending') {
        const c1 = (await api('PATCH', '/purchase-orders/1/cancel', admin)).data;
        ok('PO#1 cancelled', c1.status, 'cancelled');
    }

    console.log('SMOKE TEST COMPLETE');
})().catch((err) => {
    console.error('SMOKE TEST FAILED:', err.message);
    process.exit(1);
});
