//this will allow us to access methods defined in Units model
var Units_ref = require('./Units');

var mongoose = require('mongoose');

//schema for All the budgets that a Unit will maintain 

var AllBudgetsScheme = mongoose.Schema({
    UnitID_ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit',
        required: true
    },
    BudgetNumber:{
        type: String,
        required: true
    },
    BudgetName:{
        type: String,
        required: true
    },
    StartDate:{
        type:Date
    },
    EndDate:{
        type:Date
    }
  
});

var AllBudgets = module.exports = mongoose.model('AllBudgets', AllBudgetsScheme);


// ------------------- Helper Functions --------------------------------------------------------

//This validator function will validate Passed in JSON object contains correct data types
function validate_and_copy_passedJSON(JSON_Obj,UnitID_ref, callback) {

    var err_list = []; //this will keep all the error messages
    //Empty template of a user JSON object
    var Budget_JSON_Obj = {
        "UnitID_ref":UnitID_ref,
        "BudgetNumber": null,
        "BudgetName": null,
        "StartDate": null,
        "EndDate": null

    };

    if (typeof JSON_Obj.BudgetNumber != 'string')
        err_list.push("Budget Number is not String type");
    else
        Budget_JSON_Obj.BudgetNumber = JSON_Obj.BudgetNumber;

    if (typeof JSON_Obj.BudgetName != 'string')
        err_list.push("Budget Name is not String type");
    else
        Budget_JSON_Obj.BudgetName = JSON_Obj.BudgetName;

    if (Date.parse(Budget_JSON_Obj.StartDate) == null)
        err_list.push("Start Date is not Date type");
    else
        Budget_JSON_Obj.StartDate = JSON_Obj.StartDate;  

    if (Date.parse(Budget_JSON_Obj.EndDate) == null)
        err_list.push("End Date is not Date type");
    else
        Budget_JSON_Obj.EndDate = JSON_Obj.EndDate;

    if(err_list.length == 0)
        return Budget_JSON_Obj;
    else
    {
        callback(err_list,null);
        return null;
    }
}

//return false in error or budget number already exists and return true if budget number does not exists
module.exports.Budget_exists_under_Unit = async function (UnitID,Budget_Number,callback) 
{
    const Unit_results = await Units_ref.Unit_exsists_inCollection_byID(UnitID);
    //check if unit actually exists. if no there's no point of moving forward. 
    if(Unit_results == null)
    {
        callback(`Unit ID:"${UnitID}" does not exsists`,null);
        return false;
    }

    try
    {
        const budget_results = await AllBudgets.findOne({UnitID_ref:UnitID, BudgetNumber:Budget_Number });

        if(budget_results)
        {
            callback(`BudgetNumber:"${Budget_Number}" already exists under this Unit`,null);
            return false;
        }else
            return true;

    }catch
    {
        callback(`Internal Server error occured, while looking for budget records`,null);
        return false;
    }
}

// ------------------- End of Helper Functions --------------------------------------------------------



module.exports.add_to_All_Budgets = async function (UnitID,JSON_Obj,callback)
{
    const validated_results = validate_and_copy_passedJSON(JSON_Obj,UnitID, callback);
    if(validated_results == null)
        return;

    //check budget already exists in the database
    const results_Budgets = await AllBudgets.Budget_exists_under_Unit(UnitID, JSON_Obj.BudgetNumber, callback);
    if(results_Budgets == false)
        return;

    //now lets add the Budget to the table
    AllBudgets.create(validated_results, callback);
}


module.exports.get_all_budget_under_unit = async function(UnitID,callback)
{
    const Unit_results = await Units_ref.Unit_exsists_inCollection_byID(UnitID);
    //check if unit actually exists. if no there's no point of moving forward. 
    if(Unit_results == null)
    {
        callback(`Unit ID:"${UnitID}" does not exsists`,null);
        return false;
    }

    //now lets find all the buudgets under given unit and return to user
    AllBudgets.find({UnitID_ref:UnitID},callback);
}

module.exports.remove_budget_from_collection = function(budgetID,UnitID,callback)
{
    const Unit_results = await Units_ref.Unit_exsists_inCollection_byID(UnitID);
    //check if unit actually exists. if no there's no point of moving forward. 
    if(Unit_results == null)
    {
        callback(`Unit ID:"${UnitID}" does not exsists`,null);
        return false;
    }

    //now lets remove the budget
    AllBudgets.findByIdAndDelete(budgetID,callback);

}