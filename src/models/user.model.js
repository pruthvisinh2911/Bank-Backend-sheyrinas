const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
        email:{
            type:String,
            required:[true,"email is required for creating user"],
            trim:true,
            lowercase:true,
              match: [
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      'Please enter a valid email address'
    ],
            unique:[true,"email already exists"]
},
        name:{
            type:String,
            required:[true,"name is required to create an account"]
        },
        password:{
            type:String,
            required:[true,"password is required for creating an account"],
            minlength:[6,"password should be contain more than 6 character"],
            select:false
        }
},{
    timestamps:true
})

userSchema.pre("save",async function () {
  if(!this.isModified("password"))  
  {
    return 
  }
  const hash = await bcrypt.hash
  (this.password,10)


  
  this.password = hash

  return 
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password,this.password)
}

const userModel = mongoose.model("user",userSchema)

module.exports = userModel