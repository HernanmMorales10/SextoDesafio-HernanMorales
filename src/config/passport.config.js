//Importaciones para passport
const passport = require('passport');
const local = require('passport-local');
//Import model
const { userModel } = require('../models/user.model');
//Import utils.js
const { createHash, isValidatePassword } = require('../../utils');
//Import passport github
const GitHubStrategy = require('passport-github2');

const localStrategy = local.Strategy;

//-----------------------------------------------------//

const initializePassport = () => {

    //Estrategia local para registrarse.
    passport.use("register", new localStrategy(
        { passReqToCallback: true, usernameField: "email" }, async (req, username, password, done) => {
            const { first_name, last_name, email, age } = req.body;

            try {
                //Buscamos usuario en la base
                let user = await userModel.findOne({ email: username })

                //Validación si existe el usuario.
                if (user) {
                    console.log("El usuario ya existe.");
                    return done(null, false);
                }

                //Si no existe, se creará uno nuevo con los datos del body.
                const newUser = {
                    first_name,
                    last_name,
                    email,
                    age,
                    password: createHash(password)
                }

                //Rol de admin según consigna del desafío
                if (email == "adminCoder@coder.com" && password == "adminCod3r123") {
                    newUser.role = "admin"
                    await userModel.updateOne({ _id: newUser._id }, newUser);
                }

                //Enviamos usuario creado a la base.
                let result = await userModel.create(newUser);

                //Retorno del resultado.
                return done(null, result);

            } catch (error) {
                return done("Error al obtener el usuario." + error);
            }
        }
    ))


    //Estrategia local para logearse.
    passport.use("login", new localStrategy({ usernameField: "email" }, async (username, password, done) => {
        try {
            //Buscar usuario en la base.
            const user = await userModel.findOne({ email: username })

            
            //Validación por si no existe el usuario.
            if (!user) {
                console.log("User no existe.");
                return done(null, false);
            }

            //Comparación del pass del usuario con el pass hasheado.
            if (!isValidatePassword(user, password)) return done(null, false);

            //Resolución.
            return done(null, user);

        } catch (error) {
            return done(error);
        }
    }))


    //Estrategia para autenticarse con GitHub.
    passport.use("github", new GitHubStrategy({

        clientID: "Iv1.deeb2f97c9cba1bc",
        clientSecret: "33c286d7e9b81fbca660ebacaa124b3a6aff8bd3",
        callbackURL: "http://localhost:8080/api/sessions/githubcallback"

    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log(profile);
            let user = await userModel.findOne({ email: profile._json.email })

            if (!user) {
                let newUser = {
                    first_name: profile._json.name,
                    last_name: "",
                    age:27,
                    email: profile._json.email,
                    password: ""
                }

                let result = await userModel.create(newUser);

                done(null, result)

            } else {
                done(null, user)
            }

        } catch (error) {
            return done(error)
        }
    }
    ))

    //Serializar y deserializar.
    passport.serializeUser((user, done) => {
        done(null, user._id);
    })

    passport.deserializeUser(async (id, done) => {
        let user = await userModel.findById(id);
        done(null, user);
    })
}


//----------------------------------------------------//


module.exports = initializePassport;
