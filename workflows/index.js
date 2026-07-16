// Re-exports all workflow classes from one path (require('./workflows')) instead of one require per file.
module.exports = {
    LoginFlow: require('./LoginFlow'),
    ClientInfoFlow: require('./ClientInfoFlow'),
    ContactInfoFlow: require('./ContactInfoFlow'),
    ProjectInfoFlow: require('./ProjectInfoFlow'),
    MaterialsInfoFlow: require('./MaterialsInfoFlow'),
    LayersInfoFlow: require('./LayersInfoFlow'),
    ListInfoFlow: require('./ListInfoFlow'),
    ForgotPasswordFlow: require('./ForgotPasswordFlow'),
};
