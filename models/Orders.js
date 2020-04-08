//this will help to access modules in Users model
var Users_ref = require("./Users");
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
    }

});

var Order = module.exports = mongoose.model('Order', orderScheme);

// ------------------- Helper Functions --------------------------------------------------------------

//This validator function will validate Passed in JSON object contains correct data types
function validate_and_copy_passedJSON(JSON_Obj, callback) {

    var err_list = []; //this will keep all the error messages

    //Empty template of a user JSON object
    var Order_JSON_Obj = {
        "userID_ref": null,
        "OrderType": null,
        "OrderInfo": null,
        "OrderStatus": null,
        "ChatInfo": null,
        "assignedTo":null

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

    if (typeof JSON_Obj.OrderStatus != 'string')
        err_list.push("OrderStatus is not String type")
    else
        Order_JSON_Obj.OrderStatus = JSON_Obj.OrderStatus;
        
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

// ------------------- End of Helper Functions --------------------------------------------------------


// ------------------- API Functions ------------------------------------------------------------------------

/*this function will add a new order to the Order collection also make a directory with the name of the 
Order_ID and save all the uploaded files and files uploaded in the Chat section of the order
*/
module.exports.addOrder = async function(Order_JSON,files,callback){

    //first validate the passed in Order information
    var Order_validated = validate_and_copy_passedJSON(Order_JSON,callback);
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


//this function will return all the orders tied to a user
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



// ------------------- End of API Functions ------------------------------------------------------------------



