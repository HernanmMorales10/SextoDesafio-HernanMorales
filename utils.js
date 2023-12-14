const bcrypt = require('bcrypt');

//Creación del hasheo.
const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

//Comparación del pass del usuario con el pass hasheado.
const isValidatePassword = (user, password) => bcrypt.compareSync(password, user.password);

module.exports = {
    createHash,
    isValidatePassword
}