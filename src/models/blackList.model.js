const mongoose = require("mongoose")

const tokenBlacklistSchema = new mongoose.Schema({
    token :{
        type:String,
        required:[true,"Token is Required to Balcklist"],
        unqiue:[true,"token is already balcklisted "],
    },
    blacklistedAt:{
        type:Date,
        default:Date.now,
        immutable:true,
    }
},
{
    timestamps:true
})

tokenBlacklistSchema.index({createdAt:1},
    {expiredAfterSecond:60*60*24*3
})

const tokenBlacklistModel = mongoose.model("tokenBlackList",tokenBlacklistSchema)

module.exports = tokenBlacklistModel;