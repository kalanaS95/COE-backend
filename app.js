var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongose = require('mongoose');
var fileUpload  = require('express-fileupload');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
app.use(bodyParser.json());
app.use(fileUpload());

//adding all the required Models to the App
Departments = require('./models/Departments');
Users = require('./models/Users');
Units = require('./models/Units');
SubUnits = require('./models/SubUnits');
Orders = require('./models/Orders');


//connect to mongoose --test
var mongoPath = 'mongodb+srv://developers:123HelloWorld@cluster0-e0mig.azure.mongodb.net/test?retryWrites=true&w=majority';
mongose.connect(mongoPath, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true,  useFindAndModify: false });
var db = mongose.connection;

app.listen(process.env.PORT|| 3000);
console.log("Backend Running on Port 3000");

// ------ API Routes -------------


//------------------------get request for landing page-------------------------------------------
app.get('/',function(req,res){
    res.send('Please use /api/ to access the API');
});


//------------------------------------------------------------------------------------------------


// ------------------------------------ Department Routes ------------------------------------

//Route to add a new department to the Collection
app.post('/api/departments',function(req,res){
    var department_JSON = req.body;

    Departments.addDepartment(department_JSON,function(err,department){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":department});
        }
    });
});
// ------------------------------------ End of Department Routes ------------------------------


// ---- User Routes -------

//Route to add a new Users to the Collection
app.post('/api/users',function(req,res){
    var User_JSON = req.body;

    Users.addUser(User_JSON,function(err,user){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":user});
        }
    });
});



// ---- End of User Routes ------


// ---- Unit Routes -------

//Route to add a new Units to the Collection
app.post('/api/units',function(req,res){
    var Unit_JSON = req.body;

    Units.addUnit(Unit_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//route to add new users to Unit
app.put('/api/units/:_id',function(req,res){
    var Unit_users = req.body;
    var Unit_ID = req.params._id;
    Units.addUsers_to_Unit_byID(Unit_ID,Unit_users.userIDs,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//route to get information about all the users in the unit
app.get('/api/units/getUserInfomation/:_id',function(req,res){
    var Unit_ID = req.params._id;
    Units.getUsers_with_information(Unit_ID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


// ---- End of Unit Routes ------


// ---- SubUnit Routes -------

//route to add subunits to the collection
app.post('/api/subunits',function(req,res){
    var Unit_JSON = req.body;

    SubUnits.addSubUnits(Unit_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


//route to add submitters to the collection
app.post('/api/submitters/:_id',function(req,res){
    const Unit_JSON = req.body;
    const SubUnit_ID = req.params._id;

    SubUnits.addSubmitters(Unit_JSON,SubUnit_ID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


//route to remove submitters to the collection
app.put('/api/submitters/:_id',function(req,res){
    const Unit_JSON = req.body;
    const SubUnit_ID = req.params._id;

    SubUnits.removeSubmitter(Unit_JSON,SubUnit_ID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});



//route to add approvers to the collection
app.post('/api/approvers/:_id/:_budgetID',function(req,res){
    const approver_JSON = req.body;
    const SubUnit_ID = req.params._id;
    const Budget_ID = req.params._budgetID

    SubUnits.addApprover(SubUnit_ID,Budget_ID,approver_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//route to add new budget to a subunit given its subunit ID
app.post('/api/addNewBudgets/:_id',function(req,res){
    const budgets_JSON = req.body;
    const SubUnit_ID = req.params._id;

    SubUnits.addBudget(SubUnit_ID,budgets_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


//route to remove budget
app.get('/api/removeBudget/:_subUnitID/:_BudgetNumber',function(req,res){
    const SubUnit_ID = req.params._subUnitID;
    const BudgetNumber = req.params._BudgetNumber;

    SubUnits.removeBudget(SubUnit_ID,BudgetNumber,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


//route to get information about given subunit
app.get('/api/subunits/:_subUnitID',function(req,res){
    const SubUnit_ID = req.params._subUnitID;

    SubUnits.getSubUnitDetails(SubUnit_ID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


//route to budget information given Budget number
app.get('/api/getBudget/:_budgetID/',function(req,res){
    const budgetID = req.params._budgetID;

    SubUnits.getBudgetDetails(budgetID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//route to get information about submitters given subunit ID
app.get('/api/getSubmitterInfo/:_subUnitID/',function(req,res){
    const subUnitID = req.params._subUnitID;

    SubUnits.getSubmitterInfo(subUnitID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

app.get('/api/login/:_netID',function(req,res){
    var User_JSON = req.params._netID;

    SubUnits.loginUser(User_JSON,function(err,user){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":user});
        }
    });
});


// ---- End of SubUnit Routes ------


// ---- Orders Routes -------

//this API route will upload files to the server
app.post('/api/uploadOrder',function(req,res){
    var Order_JSON = req.body;
    var files = req.files;
    Orders.addOrder(JSON.parse(Order_JSON.JSON_body),files,function(err,order){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":order});
        }
    });
});

//this API route upload files to a given order given Order ID
app.put('/api/uploadFiles/:_orderID',function(req,res){
    const Order_ID = req.params._orderID;
    const files = req.files;

    Orders.uploadFiles(Order_ID,files,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//this API route will update the OrderInfo given OrderID
app.put('/api/updateOrderInfo/:_orderID',function(req,res){
    const Order_ID = req.params._orderID;
    const Order_JSON = req.body;
    Orders.updateOrderInfo(Order_ID,Order_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//this API route will update the updateOrderStatus given OrderID
app.put('/api/updateOrderStatus/:_orderID',function(req,res){
    const Order_ID = req.params._orderID;
    const Order_JSON = req.body;
    Orders.updateOrderStatus(Order_ID,Order_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//this API route will update the chatinfo given OrderID
app.put('/api/updateChatInfo/:_orderID',function(req,res){
    const Order_ID = req.params._orderID;
    const Order_JSON = req.body;
    Orders.updateChatInfo(Order_ID,Order_JSON,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//this API route will remove the order given orderID
app.delete('/api/removeOrder/:_orderID',function(req,res){
    const Order_ID = req.params._orderID;
    Orders.removeOrder(Order_ID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//this API route will assign an order to financial staff given OrderID and userID
app.put('/api/assignOrder/:_orderID/:_userID',function(req,res){
    const Order_ID = req.params._orderID;
    const userID = req.params._userID;
    Orders.assignOrder(Order_ID,userID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});

//this API route will return all the orders tied to a userID
app.get('/api/getOrders/:_userID',function(req,res){
    const userID = req.params._userID;
    Orders.getOrdersbyUserID(userID,function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


//this API route will return all the orders tied to a userID
app.get('/api/getAllOrders',function(req,res){
    const userID = req.params._userID;
    Orders.getAllOrders(function(err,unit){
        if(err){
            res.json({"status":false, "data":err});
        }else{
            res.json({"status":true, "data":unit});
        }
    });
});


// ---- End of Orders Routes ------
