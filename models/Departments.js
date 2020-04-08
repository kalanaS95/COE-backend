var mongoose = require('mongoose');

//schema for Departments

var departmentSchema = mongoose.Schema({
    departmentName:{
        type:String,
        required: true,
        unique:true
    }
});

var Department = module.exports = mongoose.model('Department', departmentSchema);



//This validator function will validate Passed in JSON object contains correct data types
function validate_and_copy_passedJSON(JSON_Obj, callback)
{
    //Empty template of a department JSON object
    var Department_JSON_Obj = {"departmentName":null};

    //check passed in JSON fields have correct data types
    if(typeof JSON_Obj.departmentName != 'string')
       callback("Name is not String type", null);
    else
        Department_JSON_Obj.departmentName = JSON_Obj.departmentName;

    return Department_JSON_Obj;
}






//this method will find the department name exists in the database given its name
module.exports.searchDepartment_byName = function(department,callback){

    Department.findOne(validate_and_copy_passedJSON(department,callback), callback);
}

//this method will find the department name exists in the database given its name
module.exports.searchDepartment_byObjectID = function(departmentID_JSON,callback){

    Department.findById(departmentID_JSON,callback);
}

//Method to add a department to the mongoDB 
module.exports.addDepartment = function(department,callback){

    Department.create(validate_and_copy_passedJSON(department,callback), callback);
}