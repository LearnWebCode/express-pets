const myCache = require("../cache")
const petsCollection = require("../db").db().collection("pets")
const { ObjectId } = require("mongodb")
const cloudinary = require("cloudinary").v2
const sanitizeHtml = require("sanitize-html")

const cloudinaryConfig = cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDINARYKEY,
  api_secret: process.env.CLOUDINARYSECRET,
  secure: true
})

const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {}
}

exports.homepage = async function (req, res) {
  let pets = myCache.get("pets")
  if (pets == undefined) {
    console.log("going to fetch from database")
    pets = await petsCollection.find().toArray()
    myCache.set("pets", pets, 3600)
  }
  res.render("homepage", { pets, cloudname: cloudinaryConfig.cloud_name })
}

exports.adminPage = async function (req, res) {
  if (req.cookies.petadoption == process.env.SESSIONCOOKIEVALUE) {
    let pets = myCache.get("pets")
    if (pets == undefined) {
      console.log("going to fetch from database")
      pets = await petsCollection.find().toArray()
      myCache.set("pets", pets, 3600)
    }
    res.render("admin-dashboard", { pets, cloudname: cloudinaryConfig.cloud_name })
  } else {
    res.render("login", { failedAttempt: req.query.failedAttempt })
  }
}

exports.createPetPage = (req, res) => {
  res.render("create-pet", { cloudname: cloudinaryConfig.cloud_name, apikey: cloudinaryConfig.api_key })
}

exports.loginAttempt = (req, res) => {
  if (req.body.username == process.env.ADMINUSERNAME && req.body.password == process.env.ADMINPASSWORD) {
    res.cookie("petadoption", process.env.SESSIONCOOKIEVALUE, { httpOnly: true, sameSite: "strict", path: "/", secure: true })
    res.redirect("/admin")
  } else {
    res.redirect("/admin?failedAttempt=true")
  }
}

exports.logout = (req, res) => {
  res.clearCookie("petadoption")
  res.redirect("/admin")
}

exports.getSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000)
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp
    },
    cloudinaryConfig.api_secret
  )
  res.json({ timestamp, signature })
}

exports.actuallyUpdatePet = async (req, res) => {
  if (!ObjectId.isValid(req.body._id)) {
    res.redirect("/")
  }

  if (typeof req.body.name != "string") {
    req.body.name = ""
  }
  
  if (typeof req.body.description != "string") {
    req.body.description = ""
  }

  let ourNewObject = { name: sanitizeHtml(req.body.name, sanitizeOptions), birthYear: new Date().getFullYear(), species: sanitizeHtml(req.body.species, sanitizeOptions), description: sanitizeHtml(req.body.description, sanitizeOptions) }

  if (req.body.birthYear > 999 && req.body.birthYear < 9999) {
    ourNewObject.birthYear = req.body.birthYear
  }

  if (ourNewObject.species != "cat" && ourNewObject.species != "dog") {
    ourNewObject.species = "dog"
  }

  const expectedSignature = cloudinary.utils.api_sign_request({ public_id: req.body.public_id, version: req.body.version }, cloudinaryConfig.api_secret)
  if (expectedSignature === req.body.signature) {
    ourNewObject.photo = req.body.public_id
  }

  await petsCollection.findOneAndUpdate({ _id: new ObjectId(req.body._id) }, { $set: ourNewObject })
  const pets = await petsCollection.find().toArray()
  myCache.set("pets", pets, 3600)

  // look up single pet and cache it
  const singlePet = await petsCollection.findOne({ _id: new ObjectId(req.body._id) })
  myCache.set(req.body._id, singlePet, 3600)

  res.redirect("/admin")
}

exports.storePet = async (req, res) => {
  if (typeof req.body.name != "string") {
    req.body.name = ""
  }
  
  if (typeof req.body.description != "string") {
    req.body.description = ""
  }
  
  let ourObject = { name: sanitizeHtml(req.body.name, sanitizeOptions), birthYear: new Date().getFullYear(), species: sanitizeHtml(req.body.species, sanitizeOptions), description: sanitizeHtml(req.body.description, sanitizeOptions) }

  if (req.body.birthYear > 999 && req.body.birthYear < 9999) {
    ourObject.birthYear = req.body.birthYear
  }

  if (ourObject.species != "cat" && ourObject.species != "dog") {
    ourObject.species = "dog"
  }

  const expectedSignature = cloudinary.utils.api_sign_request({ public_id: req.body.public_id, version: req.body.version }, cloudinaryConfig.api_secret)
  if (expectedSignature === req.body.signature) {
    ourObject.photo = req.body.public_id
  }

  await petsCollection.insertOne(ourObject)
  const pets = await petsCollection.find().toArray()
  myCache.set("pets", pets, 3600)
  res.redirect("/admin")
}

exports.editPage = async function (req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    res.redirect("/admin")
  }

  let pet = myCache.get(req.params.id)
  if (pet == undefined) {
    console.log("going to fetch single pet from database")
    pet = await petsCollection.findOne({ _id: new ObjectId(req.params.id) })
    myCache.set(req.params.id, pet, 3600)
  }
  // const pet = await petsCollection.findOne({ _id: new ObjectId(req.params.id) })

  if (!pet.photo) {
    pet.photo = "/images/fallback.jpg"
  } else {
    pet.photo = `https://res.cloudinary.com/${cloudinaryConfig.cloud_name}/image/upload/w_190,h_190,c_fill/${pet.photo}.jpg`
  }

  res.render("edit-pet", { pet, cloudname: cloudinaryConfig.cloud_name, apikey: cloudinaryConfig.api_key })
}

exports.deletePet = async function (req, res) {
  if (!ObjectId.isValid(req.body._id)) {
    res.redirect("/")
  }
  await petsCollection.deleteOne({ _id: new ObjectId(req.body._id) })
  const pets = await petsCollection.find().toArray()
  myCache.set("pets", pets, 3600)
  myCache.del(req.body._id)
  res.redirect("/admin")
}

exports.deletePetAsync = async function (req, res) {
  if (!ObjectId.isValid(req.body._id)) {
    res.redirect("/")
  }
  await petsCollection.deleteOne({ _id: new ObjectId(req.body._id) })
  const pets = await petsCollection.find().toArray()
  myCache.set("pets", pets, 3600)
  myCache.del(req.body._id)
  res.json({ message: "Success!" })
}

exports.onlyAdmin = function (req, res, next) {
  if (req.cookies.petadoption == process.env.SESSIONCOOKIEVALUE) {
    next()
  } else {
    res.redirect("/")
  }
}
