const express = require("express")
const router = express.Router()
const petController = require("./controllers/petController")
const contactController = require("./controllers/contactController")

// main routes
router.get("/", petController.homepage)
router.get("/admin", petController.adminPage)
router.post("/login", petController.loginAttempt)
router.get("/admin/logout", petController.logout)
router.get("/get-signature", petController.onlyAdmin, petController.getSignature)

// crud routes
router.get("/admin/create-pet", petController.onlyAdmin, petController.createPetPage)
router.post("/store-pet", petController.onlyAdmin, petController.storePet)
router.get("/admin/edit-pet/:id", petController.onlyAdmin, petController.editPage)
router.post("/admin/edit-pet", petController.onlyAdmin, petController.actuallyUpdatePet)
router.post("/admin/delete-pet", petController.onlyAdmin, petController.deletePet)
router.post("/admin/delete-pet-async", petController.onlyAdmin, petController.deletePetAsync)

// contact related routes
router.post("/submit-contact", contactController.submitContact)
router.get("/admin/view-pet-contacts/:id", petController.onlyAdmin, contactController.viewPetContacts)

module.exports = router
