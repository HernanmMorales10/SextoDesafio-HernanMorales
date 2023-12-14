//Importaciones necesarias
const express = require('express');
const router = express.Router();
const { userModel } = require('../models/user.model');
const { createHash, isValidatePassword } = require('../../utils')
const passport = require('passport');

//----------------------------------------------------------//

//Renderizar vista de registro
router.get("/register", (req, res) => {
    try {
        res.render("register.handlebars")
    } catch (error) {
        res.status(500).send("Error de presentación.")
    }
})

//Renderizar vista de login
router.get("/", (req, res) => {
    try {
        res.render("login.handlebars")
    } catch (error) {
        res.status(500).send("Error de presentación.")
    }
})

//Renderizar vista del perfil una vez logeado
router.get('/profile', (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/api/sessions');
        }

        let { first_name, last_name, email, age, role } = req.session.user;

        res.render('profile.handlebars', {
            first_name, last_name, email, age, role
        });

    } catch (error) {
        res.status(500).send("Error de presentación.")
    }
});

//--------------------------------------------------------------------//

//Destruir session
router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (!err) {
            res.redirect('/api/sessions')
        } else {
            res.send("Error al intentar salir.")
        }
    })
})


//----------------------------------------------------------------------------//

//Registrar usuario (Estrategia local)
router.post("/register", passport.authenticate("register", { failureRedirect: "/api/sessions/failRegister" }), async (req, res) => {
    try {
        console.log("Usuario registrado correctamente.");
        res.redirect("/api/sessions")

    } catch (error) {
        res.status(500).send("Error de registro.")
    }
})

//Ruta por si no se logra hacer el passport register.
router.get('/failRegister', async (req, res) => {
    console.log("Failed strategy");
    res.send({ error: "Failed" })
})



//-----------------------------------------------------------------------------//

//Logearse (Estrategia local)
router.post("/", passport.authenticate("login", { failureRedirect: "/api/sessions/failLogin" }), async (req, res) => {
    if (!req.user) {
        return res.status(400).send({ status: "error", error: "Credenciales inválidas." })
    }

    req.session.user = {
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        age: req.user.age,
        email: req.user.email,
        role: req.user.role
    }

    console.log("Datos correctos, ingresando a vista de perfil.");
    res.redirect("/api/sessions/profile")
})

//Ruta por si no se logra hacer el login con passport.
router.get("/failLogin", (req, res) => {
    res.send({ error: "Failed login" })
})




//---------------------------------------------------------------//

//Autenticación. Estrategia con GitHub.
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }), async (req, res) => { })

router.get("/githubcallback", passport.authenticate("github", { failureRedirect: "/api/sessions/" }), async (req, res) => {
    req.session.user = req.user;
    res.redirect("/api/sessions/profile")
})




//--------------------------------------------------------------//

//Renderizar vista para cambiar password.
router.get('/restore', (req, res) => {
    try {
        res.render('restore.handlebars')
    } catch (error) {
        res.status(500).send("Error de presentación.")
    }
})


//Cambiar contraseña.
router.post('/restore', async (req, res) => {
    try {
        let { email, newPassword } = req.body;
        if (!email || !newPassword) return res.status(400).send({ status: "error", error: "Valores inexistentes" })

        //Verificar existencia de usuario en db
        let user = await userModel.findOne({ email: email });

        if (!user) return res.status(400).send({ status: "error", error: "Usuario no encontrado" })

        //Actualizando password con hash
        user.password = createHash(newPassword);

        //Actualizamos usuario en la base con su nuevo password.
        await userModel.updateOne({ _id: user._id }, user);

        //Redirigir para logearse.
        res.redirect("/api/sessions");

    } catch (error) {
        res.status(500).send("Error al cambiar contraseña.")
    }
})



module.exports = router;















