var mongoose = require('mongoose');


//schema for users
var userSchema = mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    UWID: {
        type: String,
        required: true,
        unique: true
    },
    profileImage_URL: {
        type: String,
    },
    verified_user: {
        type: Boolean,
        default: false
    }

});

var User = module.exports = mongoose.model('User', userSchema);



// ------------------- Helper Functions --------------------------------------------------------

//This validator function will validate Passed in JSON object contains correct data types
function validate_and_copy_passedJSON(JSON_Obj, callback) {

    var err_list = []; //this will keep all the error messages
    //Empty template of a user JSON object
    var User_JSON_Obj = {
        "Name": null,
        "email": null,
        "UWID": null,
        "profileImage_URL": null,
        "verified_user": false

    };

    if (typeof JSON_Obj.Name != 'string')
        err_list.push("Name is not String type");
    else
        User_JSON_Obj.Name = JSON_Obj.Name;

    if (typeof JSON_Obj.email != 'string')
        err_list.push("email is not String type");
    else
        User_JSON_Obj.email = JSON_Obj.email;

    if (typeof JSON_Obj.UWID != 'string')
        err_list.push("UWID is not String type");
    else
        User_JSON_Obj.UWID = JSON_Obj.UWID;  

    if (typeof JSON_Obj.profile_imageURL != 'string')
        err_list.push("profile_imageURL is not String type");
    else
        User_JSON_Obj.profileImage_URL = JSON_Obj.profile_imageURL;

    if (typeof JSON_Obj.verified_user != 'boolean')
        err_list.push("verified_user is not Boolean type");
    else
        User_JSON_Obj.verified_user = JSON_Obj.verified_user;


    if(err_list.length == 0)
        return User_JSON_Obj;
    else
    {
        callback(err_list,null);
        return null;
    }
}


//this function will validate if a given userID is actually exists in the Users collection
module.exports.validate_UserID = async function (UserID)
{
    try{
        return (await User.findById(UserID));
    }catch{
        return null;
    }
}

//this function will return the user information if user existis in the collection, given user ID
module.exports.User_exsists_inCollection_byID = async function(userID){

    try{
        return (await User.findById(userID));
    }catch //cath will be executed when mongoose cant find the record !
    {
        return null;
    }
}


//this function will check whether if given Unit exists in the collection by its name
async function User_exsits_inColleciton_byName(User_name)
{
    try{
        return (await User.findOne({"Name":User_name}));
    }catch{
        return null;
    }
}

// ------------------- End of Helper Functions --------------------------------------------------------


// ------------------- API Functions ------------------------------------------------------------------

//Method to add a new user to the mongoDB 
module.exports.addUser = function (user, callback) {
    
    //ToDO; Check if user already exists before adding
    const validated_results = validate_and_copy_passedJSON(user,callback);
    if(validated_results == null)
        return;

    User.create(validated_results, callback);
}

//this method will find user by given id
module.exports.searchUser_byObjectID = function(userID,callback){

    User.findById(userID,callback);
}




// ------------------- End of API Functions ------------------------------------------------------------------