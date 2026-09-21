module.exports = (user) => {
    if (!user) return null;

    const data = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
    delete data.password;
    return data;
};
