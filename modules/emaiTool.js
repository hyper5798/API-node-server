module.exports = {
  sendMail
}

async function sendMail(_email,_subject, _html) {
  const nodemailer = require('nodemailer')
  const mailConfig = require('../config/mail.json')
  
  const options = {
    host: mailConfig.host,
    secureConnecton: true,
    port: mailConfig.port,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
    }
  }

  let content = 'hi, <br><br>&nbsp;&nbsp;' +_html + '<br><br>  系統通知' + getDate()
  const mailOptions = {
    from: mailConfig.user,
    to: _email,
    subject: _subject,
    html: content,
  }

  const transporter = nodemailer.createTransport(options)
  const Promise = require('bluebird')
  return new Promise((resolve,reject)=>{
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log("error is "+error);
        resolve(false); // or use rejcet(false) but then you will have to handle errors
      } 
      else {
        console.log('Email sent: ' + info.response);
        resolve(true);
      }
    })
  })
}

//Jason add for fix timezone issue on 2020.10.22
function getDate() {
  let d = new Date()
  //console.log('TimezoneOffset'+d.getTimezoneOffset())
  d.setTime(d.getTime() + ( (480+d.getTimezoneOffset() ) *60*1000));
  return d.toLocaleString()
}
