/*jshint esversion: 9 */
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/mortgagecalculatorDB');

const banksSchema = {
  name: String,
  interestRate: Number,
  maximumLoan: Number,
  minimumDownPayment: Number,
  loanTerm: Number
 };

const Bank = mongoose.model('Bank', banksSchema);

const bank1 = new Bank ({
  name: 'Default Bank',
  interestRate: 10,
  maximumLoan: 300000,
  minimumDownPayment: 20000,
  loanTerm: 15
});

const defaultBanks = [bank1];

app.get("/", function (req, res) {

  Bank.find({}, function (err, foundBanks) {
    if (foundBanks.length === 0) {
      Bank.insertMany(bank1, function (err) {
        if (err) {
          console.log("Error!");
        } else {
          console.log("Successfully added default items");
        }
      });
      res.redirect("/");
    } else {
          res.render("list", {banks: foundBanks});
    }
});

});

app.post("/", function(req, res) {

  const newBank = new Bank ({
    name: req.body.bankName,
    interestRate: req.body.interestRate,
    maximumLoan: req.body.maximumLoan,
    minimumDownPayment: req.body.minimumDownPayment,
    loanTerm: req.body.loanTerm
  });

    newBank.save();

    res.redirect("/");


});

app.get('/edit/:id', function(req, res){
  Bank.findById(req.params.id, function (err, foundBank) {
    if (foundBank) {
      res.render("edit", {_id: foundBank.id,
      name: foundBank.name,
      interestRate: foundBank.interestRate,
      maximumLoan: foundBank.maximumLoan,
      minimumDownPayment: foundBank.minimumDownPayment,
      loanTerm: foundBank.loanTerm});
    } else {
      res.redirect("/");
    }

    });
});

app.post("/edit/:id", function(req, res) {

  Bank.findById(req.params.id, function (err, foundBank) {
    if (foundBank) {
      foundBank.interestRate=req.body.newinterestRate;
      foundBank.maximumLoan=req.body.newmaximumLoan;
      foundBank.minimumDownPayment=req.body.newminimumDownPayment;
      foundBank.loanTerm=req.body.newloanTerm;
      foundBank.save();
      res.redirect("/");
    } else {
      res.redirect("/");
    }
  });

});

app.post("/remove", function(req, res) {
console.log(req.body.removeButton);
  Bank.deleteOne({ _id: req.body.removeButton }, function (err) {
    if (!err) {
      console.log("Successfully deleted checked item");
    }
  });
  res.redirect("/");
});

app.get("/calculator", function (req, res) {
  Bank.find({}, function (err, foundBanks) {
    const selectedBankId = req.params.bankNames;
    Bank.findById(selectedBankId, function (err, selectedBank) {
      let maxLoan = bank1.maximumLoan;
      let minimumDownPayment = bank1.minimumDownPayment;
      let bankId = new Object("");
      let mortgage = 0;
      if(selectedBank != null) {
        maxLoan = selectedBank.maximumLoan;
        minimumDownPayment = selectedBank.minimumDownPayment;
        bankId = selectedBank._id;
      }

      res.render('calculator', {
        banks: foundBanks,
        bankId: bankId,
        maxLoan: maxLoan,
        minimumDownPayment: minimumDownPayment,
        mortgage: mortgage
      });
    });
  });

});

app.post('/calculator', (req, res)=> {
  Bank.find({}, function (err, foundBanks) {
    const selectedBankId = req.body.bankNames;
    Bank.findById(selectedBankId, function (err, selectedBank) {
      let maxLoan = bank1.maximumLoan;
      let minimumDownPayment = bank1.minimumDownPayment;
      let bankId = new Object("");
      let mortgage = 0;
      if(selectedBank != null) {
        maxLoan = selectedBank.maximumLoan;
        minimumDownPayment = req.body.downPayment;
        loanTerm = selectedBank.loanTerm;
        interestRate = selectedBank.interestRate;
        bankId = selectedBank._id;
        initialLoan = req.body.initialLoan;

        var topFormula = (initialLoan-minimumDownPayment)*(interestRate*0.01/12)*Math.pow((1 + (interestRate*0.01/12)), loanTerm*12);
        var bottomFormula = Math.pow((1 + (interestRate*0.01/12)), loanTerm*12) - 1;
        mortgage = Math.round(topFormula/bottomFormula);
      }

      res.render('calculator', {
        banks: foundBanks,
        bankId: bankId,
        maxLoan: maxLoan,
        minimumDownPayment: minimumDownPayment,
        mortgage: mortgage
      });
    });
  });

});



app.listen(3000, function () {
  console.log("Server started on port 3000");
});
