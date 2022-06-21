require("dotenv").config();
const nodemailer = require("nodemailer");

const userEmail = process.env.USER_EMAIL;
const userPass = process.env.USER_PASS

const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: userEmail,
        pass: userPass
    }
});

const sendVerificationEmail = (email, name, verficationCode) => {
    transport.sendMail({
        from: userEmail,
        to: email,
        subject: "Bitte bestätigen Sie Ihre E-Mail",
        html: `
            <h1>E-Mail Bestätigung</h1>
            <h2>Hallo, ${name}!</h2>
            <p>Vielen Dank für Ihre Anmeldung. Bitte bestätigen Sie Ihre E-Mail, 
            indem Sie auf diesen <a href=http://localhost:8080/verify/${verficationCode}>Link</a> klicken.</p>
            `
    }).catch(error => console.log(error))
};

module.exports = {
    sendVerificationEmail
}
