const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const emailService = require("../services/email.service")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")

async function createTransaction(req,res){
    const {fromAccount,toAccount,amount,idempotencyKey} = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"FromAccount , toAccount , Amounnt and idempotencyKey are required"
        })
    }

    // ✅ FIX: secure ownership
    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,
        user:req.user._id
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }

    const isTransactionAlreadyExist = await transactionModel.findOne({
        idempotencyKey : idempotencyKey
    })

    if(isTransactionAlreadyExist){
        if(isTransactionAlreadyExist.status === "COMPLETED"){
           return res.status(200).json({
                message:"transaction already processed",
                transaction:isTransactionAlreadyExist
            })
        }

        if(isTransactionAlreadyExist.status === "PENDING"){
           return res.status(200).json({
                message:"Transaction is still processing"
            })
        }

        if(isTransactionAlreadyExist.status === "FAILED"){
           return res.status(500).json({
                message:"Transaction processing failed , please try again"
            })
        }

        if(isTransactionAlreadyExist.status === "REVERSED"){
            return res.status(500).json({
                message:"Transaction is Reversed please try again later"
            })
        }
    }

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message:"Both FromAccount and toAccount must be Active to Process Transaction"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    let transaction

    try{

        // ✅ FIX: balance check inside transaction
        const balanceData = await ledgerModel.aggregate([
            { $match: { account: fromUserAccount._id } },
            {
                $group: {
                    _id: null,
                    totalDebit: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
                        }
                    },
                    totalCredit: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
                        }
                    }
                }
            }
        ]).session(session)

        const balance = balanceData.length === 0
            ? 0
            : balanceData[0].totalCredit - balanceData[0].totalDebit

        if(balance < amount){
            throw new Error(`insufficient Balance. current balance is ${balance}. Requested amount is ${amount}`)
        }

        const transactionArr = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        }],{session})

        transaction = transactionArr[0]

        await ledgerModel.create([{
            account:fromAccount,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT"
        }],{ session })

        await ledgerModel.create([{
            account:toAccount,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
        }],{ session })

        transaction.status = "COMPLETED"
        await transaction.save({session})
        
        await session.commitTransaction()
        session.endSession()

        await emailService.sendTransactionEmail(req.user.email,req.user.name,amount,toAccount)

        return res.status(201).json({
            message:"Transaction completed Successfully"
        })

    }catch(error){
        await session.abortTransaction()
        session.endSession()


        if(transaction){
            transaction.status = "FAILED"
            await transaction.save()
        }

        console.error(error)

        return res.status(500).json({
            message:error.message || "Transaction failed",
        })
    }
}

async function createInitialFundsTransaction(req,res){
    const {toAccount , amount , idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"toAccess , amount , and idempotency are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!toUserAccount){
        return res.status(400).json({
            message:"invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if(!fromUserAccount){
        return res.status(400).json({
            message:"System user account is not found"
        })
    }

    if(fromUserAccount._id.toString() === toAccount){
        return res.status(400).json({
            message:"fromAccount and toAccount cannot be same"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try{

        const transaction = new transactionModel({
            fromAccount:fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING",
        })  

        await transaction.save({ session })

        await ledgerModel.create([{
            account:fromUserAccount._id,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT",
        }],{ session })

        await ledgerModel.create([{
            account:toAccount,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
        }],{ session })

        transaction.status = "COMPLETED"
        await transaction.save({session})

        await session.commitTransaction()
        session.endSession()

        return res.status(201).json({
            message:"initial funds transaction completed successfully",
            transaction:transaction
        })

    }catch(error){
        await session.abortTransaction()
        session.endSession()

        console.error(error)

        return res.status(500).json({
            message:"Initial transaction failed",
            error:error.message
        })
    }
}

module.exports ={
    createTransaction,
    createInitialFundsTransaction
}




