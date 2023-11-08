const express = require("express")
var cookieParser = require("cookie-parser")
const router = require("./router")
const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.static("public"))
app.use(cookieParser())

app.set("views", "views")
app.set("view engine", "ejs")

app.use("/", router)

module.exports = app
