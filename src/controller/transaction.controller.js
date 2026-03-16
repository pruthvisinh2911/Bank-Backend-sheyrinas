const transactionModel = require("../models/transaction.model")

const ledgerModel = require("../models/ledger.model")

async function createTransaction(req,res){
    const {fromAccount,toAccount,Amount,idempotencyKey} = req.body
}