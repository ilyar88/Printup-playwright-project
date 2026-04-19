// Gathers all workflow classes into one object and exports them together,
// so other files can import multiple workflows from a single path (e.g. require('./workflows'))
// instead of requiring each workflow file individually.
module.exports = {
    LoginFlow: require('./LoginFlow'),
    ClientInfoFlow: require('./ClientInfoFlow'),
    ContactInfoFlow: require('./ContactInfoFlow'),
    ProjectInfoFlow: require('./ProjectInfoFlow'),
    MaterialsInfoFlow: require('./MaterialsInfoFlow'),
    LayersInfoFlow: require('./LayersInfoFlow'),
};
