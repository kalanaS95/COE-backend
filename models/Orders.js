//this will help to access modules in Users model
var Users_ref = require("./Users");
var approvalLogicReponses_Modal = require("./approval_info");
var SubUnit_ref = require("./SubUnits");
var Unit_ref = require("./Units");


var mongoose = require('mongoose');
var fs = require('fs');
var rimraf = require("rimraf");

//schema for SubUnits

var orderScheme = mongoose.Schema({

    userID_ref:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required: true
    },
    OrderType:{
        type:String,
        required: true
    },
    OrderInfo:{
        type: String,
        required: true
    },
    OrderStatus:{
        type:String,
        required:true
    },
    ChatInfo:{
        type:String,
        required:true
    },
    assignedTo:{
        type:mongoose.Types.ObjectId,
        ref:'User'
    },
    submittedOn:{
        type:Date,
        default: Date.now
    },
    lastModified:{
        type:Date,
        default: Date.now
    },
    AribaReference:{
        type:String,
        default: null
    },
    ApprovalResponses:[approvalLogicReponses_Modal],
    AwaitingResponses: {
        type:[mongoose.Types.ObjectId],
        ref: 'User'
    },
    Unit_SubUnit_ref:{
        type:String
    }

    

});

var Order = module.exports = mongoose.model('Order', orderScheme);

// ------------------- Helper Functions --------------------------------------------------------------

//This validator function will validate Passed in JSON object contains correct data types
function validate_and_copy_passedJSON(JSON_Obj,approvalResponse ,callback) {

    var err_list = []; //this will keep all the error messages

    //Empty template of a user JSON object
    var Order_JSON_Obj = {
        "userID_ref": null,
        "OrderType": null,
        "OrderInfo": null,
        "OrderStatus": null,
        "ChatInfo": null,
        "assignedTo":null,
        "AribaReference": null,
        "ApprovalResponses":approvalResponse.Approval_reponses,
        "AwaitingResponses":approvalResponse.awaiting_reposnses,
        "Unit_SubUnit_ref": approvalResponse.Unit_Subunit_ID

    };

    if (typeof JSON_Obj.userID_ref != 'string')
        err_list.push("userID_ref is not String type")
    else
        Order_JSON_Obj.userID_ref = JSON_Obj.userID_ref;

    if (typeof JSON_Obj.OrderType != 'string')
        err_list.push("OrderType is not String type")
    else
        Order_JSON_Obj.OrderType = JSON_Obj.OrderType;
        
    if (typeof JSON_Obj.OrderInfo != 'string')
        err_list.push("OrderInfo is not String type")
    else
        Order_JSON_Obj.OrderInfo = JSON_Obj.OrderInfo;

    /*if (typeof JSON_Obj.OrderStatus != 'string')
        err_list.push("OrderStatus is not String type")
    else
        Order_JSON_Obj.OrderStatus = JSON_Obj.OrderStatus;*/
    
    if(approvalResponse.already_approved == true)
        Order_JSON_Obj.OrderStatus = "Approved";
    else
        Order_JSON_Obj.OrderStatus = "Awaiting Approval";
        
    if (typeof JSON_Obj.ChatInfo != 'string')
        err_list.push("ChatInfo is not String type")
    else
        Order_JSON_Obj.ChatInfo = JSON_Obj.ChatInfo;
        
    if (typeof JSON_Obj.assignedTo != 'string' && JSON_Obj.assignedTo != null)
        err_list.push("assignedTo is not String type")
    else
        Order_JSON_Obj.assignedTo = JSON_Obj.assignedTo; 
           
    if(err_list.length == 0)
        return Order_JSON_Obj;
    else
    {
        callback(err_list,null);
        return null;
    }
        
}

//this function will check if given order ID existst in the collection given order ID
module.exports.check_Order_exists_byID = async function(orderID){
    try
    {
       return await Order.findById(orderID);
    }catch
    {
        return null;
    }
    
}
function calculate_awaiting_reponses(Approval_reponses)
{
    var res = [];

    for(var x=0;x<Approval_reponses.length;x++)
        for(var y=0;y<Approval_reponses[x].approverResponses.length;y++)
            if(Approval_reponses[x].approverResponses[y].response == null)
                res.push(Approval_reponses[x].approverResponses[y].approverID_ref);


    if(res.length <= 0)
        return {"awaiting_reposnses":res, "already_approved":true};
    else
        return {"awaiting_reposnses":res, "already_approved":false} ;

}

async function construct_approvalInfo(OrderType, LineItems, type, Sub_OR_UnitID,submitterID)
{
    var lowercase_type = type.toLowerCase();
    var Approval_reponses = [];
    
    if(lowercase_type == "subunit")
    {
        for(var x=0;x<LineItems.length;x++)
        {
            
            for(var y=0;y<LineItems[x].Budgets.length;y++)
            {
                var ret_val = await SubUnit_ref.getApprovers_and_approvalLogic_given_budgetNumber(LineItems[x].Budgets[y].Number,Sub_OR_UnitID);
                var calculated_amount = calculate_spilt(LineItems[x].Amount,LineItems[x].Budgets[y].Split);
                var result = construct_a_approval_logic_for_the_order_and_approver_response_part(ret_val.approvers,ret_val.approvalLogic,calculated_amount,OrderType,submitterID);
                if(result.PI_request)
                    Approval_reponses.push(construct_approval_Info_JSON_Object(result.approvalLogic,result.approverResponses,LineItems[x].Budgets[y].Number,LineItems[x].id,true))
                else
                    Approval_reponses.push(construct_approval_Info_JSON_Object(result.approvalLogic,result.approverResponses,LineItems[x].Budgets[y].Number,LineItems[x].id,null))    
                
            }
            
        }
        const awaiting_reposnses = calculate_awaiting_reponses(Approval_reponses);
        return {"Approval_reponses":Approval_reponses, "awaiting_reposnses":awaiting_reposnses.awaiting_reposnses, "already_approved":awaiting_reposnses.already_approved, "Unit_Subunit_ID":Sub_OR_UnitID};
    }else if(lowercase_type == "unit")
    {
        //this variable will keep all the budgets in a Unit
        var allBudgets_ = [];
        //for this first we need to find out all the budgets in the unit
        const allSubunits = await Unit_ref.getAllSubUnitIDs(Sub_OR_UnitID);
        
        for(var x=0;x<allSubunits.length;x++)
        {
            var SubUnit_info = await SubUnit_ref.findById(allSubunits[x]);
            if(SubUnit_info)
                allBudgets_.push.apply(allBudgets_,SubUnit_info.BudgetTable);
                
        }

        //process line items -- not my best wrok
        for(var x=0;x<LineItems.length;x++)
            for(var y=0;y<LineItems[x].Budgets.length;y++)
            {
                var ret_val = find_approvers_and_approval_logic(allBudgets_, LineItems[x].Budgets[y].Number);
                for(var z = 0;z<ret_val.length;z++)
                {
                    var calculated_amount = calculate_spilt(LineItems[x].Amount,LineItems[x].Budgets[y].Split);
                    var result = construct_a_approval_logic_for_the_order_and_approver_response_part(ret_val[z].approvers,ret_val[z].approvalLogic,calculated_amount,OrderType,submitterID);
                    if(result.PI_request)
                        Approval_reponses.push(construct_approval_Info_JSON_Object(result.approvalLogic,result.approverResponses,LineItems[x].Budgets[y].Number,LineItems[x].id,true))
                    else
                        Approval_reponses.push(construct_approval_Info_JSON_Object(result.approvalLogic,result.approverResponses,LineItems[x].Budgets[y].Number,LineItems[x].id,null))                        
                }
            }


            //console.log(Approval_reponses);
            const awaiting_reposnses = calculate_awaiting_reponses(Approval_reponses);
            return {"Approval_reponses":Approval_reponses, "awaiting_reposnses":awaiting_reposnses.awaiting_reposnses, "already_approved":awaiting_reposnses.already_approved, "Unit_Subunit_ID":Sub_OR_UnitID};
    }


}

function find_approvers_and_approval_logic(allBudgets, BudgetNumber)
{
    var results = [];
    for(var x=0;x<allBudgets.length;x++)
    {
        if(allBudgets[x].budgetNumber == BudgetNumber)
            results.push({"approvers":allBudgets[x].approvers, "approvalLogic":allBudgets[x].approvalLogic})
        
    }

    return results;

}

function calculate_spilt(TotalAmount,Split)
{
    if(Split.indexOf('$')>-1) //means this is a currency based split
    {
        const amount = Split.replace('$','');
        return (Number(TotalAmount) - Number(amount)).toFixed(2);
    }else if(Split.indexOf('%')>-1) //means this is a percentage based split
    {
        const percentage = Split.replace('%','');
        return (Number(TotalAmount) * (Number(percentage)/100)).toFixed(2);
    }
}

function construct_a_approval_logic_for_the_order_and_approver_response_part(approvers, givenLogic, amount, OrderType,submitterID)
{
    //console.log(approvers);
    //this will keep the approval response part and new approval logic part
    var result = [];
    var new_approver_logic = "";
    //keep track if the given logic contains only AND logics or only OR logics
    var is_only_AND_logics = false;

    //check if the given logical string only contains AND logics or OR logics
    if(givenLogic.includes('&&'))
        is_only_AND_logics = true;
    else
        is_only_AND_logics = false;

        
    for(var x=0;x<approvers.length;x++)
    {
        var approvers_limit = 0;
        if(approvers[x].limit == null) //this represents a case where approver's limit is  unlimited 
            approvers_limit = Infinity;
        else
            approvers_limit = Number(approvers[x].limit);

        //this represents a case, where the order was submitted by the PI of the subunit
        if(approvers[x].PI && approvers[x].ID == submitterID)
        {
            
            //in this case we dont need any approval from other approvers. Just PI in the approval logic and his reponse should be yes
            result = [{"approverID_ref":approvers[x].ID, "response":true}]
            new_approver_logic = approvers[x].ID;
            return {"approvalLogic":new_approver_logic, "approverResponses":result, "PI_request":true};

        }
        //check if the approver is capable of approving this request if yes, then add him to the result array
        else if(approvers[x].allowedRequests.includes(OrderType) && approvers_limit >= Number(amount) && approvers[x].ID != submitterID)
        {
            result.push({"approverID_ref":approvers[x].ID, "response":null});
            if(is_only_AND_logics)
                new_approver_logic += approvers[x].ID + "&&";
            else
                new_approver_logic += approvers[x].ID + "||";
  
        }
    }

            
        
    //icheck if we have unwanted && or || operators appended to the end, if yes remove dem 
    if(new_approver_logic[new_approver_logic.length - 1] == "&" || new_approver_logic[new_approver_logic.length - 1] == "|")
        new_approver_logic = new_approver_logic.slice(0,- 2);
    

    //returning new approval logic and approver response part
    return {"approvalLogic":new_approver_logic, "approverResponses":result, "PI_request":false};
    
}

function construct_approval_Info_JSON_Object(approvalLogicString, approvalResponses, BudgetNumber, LineItemNumber, finalResult)
{
    return {
        "lineItemID":Number(LineItemNumber),
        "approvalLogic": approvalLogicString,
        "approverResponses":approvalResponses,
        "finalResult":finalResult,
        "BudgetNumber":BudgetNumber
    }
}

// ------------------- End of Helper Functions --------------------------------------------------------


// ------------------- API Functions ------------------------------------------------------------------------

/*this function will add a new order to the Order collection also make a directory with the name of the 
Order_ID and save all the uploaded files and files uploaded in the Chat section of the order
*/
module.exports.addOrder = async function(Order_JSON,files,Sub_OR_UnitID,type,callback){
    const parsed_OrderInfo = JSON.parse(Order_JSON.OrderInfo);
    const approval_responses = await construct_approvalInfo(Order_JSON.OrderType,parsed_OrderInfo.LineItems,type,Sub_OR_UnitID,Order_JSON.userID_ref);
    console.log(approval_responses);
    //first validate the passed in Order information
    var Order_validated = validate_and_copy_passedJSON(Order_JSON,approval_responses,callback);
    if(Order_validated == null)
        return;

    //check if the passed in user ID exists
    try
    {
        const User_validated = await Users_ref.validate_UserID(Order_validated.userID_ref);
        if(User_validated == null)
        {
            callback(`UserID ${Order_validated.userID_ref} does not exists`,null);
            return;
        }
    }catch
    {
        callback(`Internel Server Error Occured`,null);
        return;
    }

    //now lets add the order to the database
    try
    {

        const order_pushed = await Order.create(Order_validated);

        if(files != null)
        {
            //get number of files uploaded
            const file_names = Object.keys(files);
            const DIR_path = __dirname+"/../orders/"+order_pushed._id;
            //lets make a directory under orders with order ID
            fs.mkdir(DIR_path, (err)=>{
                if(err)
                    callback(`Internel Server Error Occured while uploading documents`,null);
                    //also remove the created record in order collection
                    Order.remove({_id:order_pushed._id});
                    return;       
                });
            //now lets move all the uploaded files to the newly created directory
            for(var x=0;x<file_names.length;x++)
            {
                files[file_names[x]].mv(DIR_path+"/"+files[file_names[x]].name,(err)=>{
                    if(err)
                    {
                        callback(`Error occured while moving files`,null);
                        return;
                    }
                });
            }
        }
        
        callback(null,order_pushed); 



    }catch(err)
    {
        console.log(err);
        callback(`Internel Server Error Occured while pushing information to Collection`,null);
    }
    //callback(`Internel Server Error Occured while pushing information to Collection`,null);
}

//this function will upload file/attachments to the order given order ID
module.exports.uploadFiles = async function(orderID,files,callback){

    //get number of files uploaded
    const file_names = Object.keys(files);


    if( await Order.check_Order_exists_byID(orderID) == null) 
    {
        callback("Invalid Order ID",null);
        return;
    }

    //update last modified field
    try{
        await Order.findOneAndUpdate({_id:orderID},{lastModified:Date.now()},{new: true});
    }catch{
        callback("Internal server error occured while updating modified time",null);
        return;
    }

    const DIR_path = __dirname+"/../orders/"+orderID;

    //now lets move all the uploaded files to the newly created directory
    for(var x=0;x<file_names.length;x++)
    {
        files[file_names[x]].mv(DIR_path+"/"+files[file_names[x]].name,(err)=>{
            if(err)
            {
                callback(`Error occured while moving files`,null);
                return;
            }
        });
    }    

    callback(null,"Files successfully uploaded");

}


//this function will update order Info given Order ID
module.exports.updateOrderInfo = async function(orderID,Order_JSON,callback){

    //check order exists in the collection
    if(await Order.check_Order_exists_byID(orderID) == null)
    {
        callback("Invalid Order ID",null);
        return;
    }

    //if found then update with the information
    Order.findOneAndUpdate({_id:orderID},{OrderInfo:Order_JSON.OrderInfo,lastModified:Date.now()},{new: true},callback);

}


//this function will update order status given Order ID
module.exports.updateOrderStatus = async function(orderID,Order_JSON,callback){

    //check order exists in the collection
    if(await Order.check_Order_exists_byID(orderID) == null)
    {
        callback("Invalid Order ID",null);
        return;
    }

    //if found then update with the information
    Order.findOneAndUpdate({_id:orderID},{OrderStatus:Order_JSON.OrderStatus,lastModified:Date.now()},{new: true},callback);

}

//this function will update chat info given Order ID
module.exports.updateChatInfo = async function(orderID,Order_JSON,callback){

    //check order exists in the collection
    if(await Order.check_Order_exists_byID(orderID) == null)
    {
        callback("Invalid Order ID",null);
        return;
    }

    //if found then update with the information
    Order.findOneAndUpdate({_id:orderID},{ChatInfo:Order_JSON.ChatInfo},{new: true},callback);

}

//this function will remove an order and associated files given order ID
module.exports.removeOrder = async function(orderID,callback){

    //check order exists in the collection
    if(await Order.check_Order_exists_byID(orderID) == null)
    {
        callback("Invalid Order ID",null);
        return;
    }

    const DIR_path = __dirname+"/../orders/"+orderID;
    //remove all the associated files to this order - using rimraf library
    rimraf(DIR_path,(err)=>{
        if(err)
        {
            callback("Error occured while removing attachments associated with this order",null);
            return;
        }
    })

    //if found then update with the information
    Order.findByIdAndDelete({_id:orderID},callback);

}

//this function will assign a user to an Order
module.exports.assignOrder = async function(orderID,UserID,callback){

    //check userID exists
    if(await Users_ref.validate_UserID(UserID) == null)
    {
        callback("Invalid User ID",null);
        return;
    }

    //check order exists in the collection
    if(await Order.check_Order_exists_byID(orderID) == null)
    {
        callback("Invalid Order ID",null);
        return;
    }
    
    //if found then update with the information
    Order.findOneAndUpdate({_id:orderID},{assignedTo:UserID},{new: true},callback);

}

module.exports.getAssignedOrders = async function(userID,callback)
{
    //check userID exists
    if(await Users_ref.validate_UserID(userID) == null)
    {
        callback("Invalid User ID",null);
        return;
    }

    Order.find({"assignedTo":userID},callback);
}


//this function will return all the orders tied to a user
module.exports.getOrdersbyUserID = async function(UserID,callback){
    //first check if the user exists in the database
    const result = await Users_ref.User_exsists_inCollection_byID(UserID);

    if(result == null)
    {
        callback(`UserID ${UserID} does not exist in the database`,null);
        return;
    }

    //now lets look for all the orders under given userID
    try
    {

        callback(null, await Order.find({userID_ref:UserID}));

    }catch{
        callback(`Internal Error occured while fetching Order Information`,null);
        return;
    }
}


//this function will return all the orders 
module.exports.getAllOrders = async function(callback){

    //now lets look for all the orders under given userID
    try
    {
        callback(null, await Order.find({}));

    }catch{
        callback(`Internal Error occured while fetching Order Information`,null);
        return;
    }
}


//this function will return all the orders under an approver given it ID, SubUnit ID
module.exports.findApprovers_orders = async function(approverID, subUnitID, callback)
{
    var orders_to_send = [];

    //finding all the orders from the submitters
    try{
        const fetched_orders = await Order.find({"Unit_SubUnit_ref":subUnitID.toString(),"AwaitingResponses":approverID})
    }catch{

    }
    //
}


// ------------------- End of API Functions ------------------------------------------------------------------



