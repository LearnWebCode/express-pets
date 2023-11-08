let signatureResponse
let isFormLocked = false
let hasFormBeenSubmitted = false

async function start() {
  // get signature. In reality you could store this in localstorage or some other cache mechanism, it's good for 1 hour
  const signaturePromise = await fetch("/get-signature")
  signatureResponse = await signaturePromise.json()
}

start()

document.getElementById("file-field").addEventListener("change", async function () {
  // lock the form and disable submit action and clickable submit button
  document.querySelector("#submit-btn").style.opacity = ".1"
  isFormLocked = true

  const data = new FormData()
  data.append("file", document.querySelector("#file-field").files[0])
  data.append("api_key", api_key)
  data.append("signature", signatureResponse.signature)
  data.append("timestamp", signatureResponse.timestamp)

  const cloudinaryResponse = await axios.post(`https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`, data, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: function (e) {
      console.log(e.loaded / e.total)
    }
  })
  console.log(cloudinaryResponse.data)

  document.querySelector(".photo-preview").innerHTML = `<img src="https://res.cloudinary.com/${cloud_name}/image/upload/w_190,h_190,c_fill/${cloudinaryResponse.data.public_id}.jpg" />`

  document.getElementById("public_id").value = cloudinaryResponse.data.public_id
  document.getElementById("version").value = cloudinaryResponse.data.version
  document.getElementById("signature").value = cloudinaryResponse.data.signature

  // unlock form and re-enable submit action and submit clickable button
  document.querySelector("#submit-btn").style.opacity = "1"
  isFormLocked = false
})

document.getElementById("manage-pet-form").addEventListener("submit", e => {
  if (isFormLocked || hasFormBeenSubmitted) {
    e.preventDefault()
  }
  if (!isFormLocked) {
    hasFormBeenSubmitted = true
  }
})
