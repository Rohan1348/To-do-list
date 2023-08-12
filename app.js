//jshint esversion:6

//to remove a collection from a database "db.collection_name.drop()"

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
//here instead of using arrays we will create database where we will be storing our data

 //connecting mongodb------------locally
// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//   useNewUrlParser: true,}).then(() => {
//     console.log("connection successfull");
//   }).catch((err) => console.log("no connection"));

// connecting mongodb------------cluster(online)
mongoose.connect("mongodb+srv://admin:admin1348@cluster0.dbfnu.mongodb.net/todolistDB", {
  useNewUrlParser: true,}).then(() => {
  console.log("connection successfull");
}).catch((err) => console.log(err));

//----------------------------------->
//creating item scheme
const itemSchema = {
  name: String
};

//creating model
const Item = mongoose.model("Item", itemSchema);

//creating objects using the model
const item1 = new Item({
  name: "Welcome!"
});

const item2 = new Item({
  name: "Hit + to add a new item."
});

const item3 = new Item({
  name: "<--Hit this to delete a item."
});


//storing the documents in a const so that we can insert it later in the Item collection
const defaultItems = [item1, item2, item3];

//--------------------------->
//creating list scheme
const listSchema = {
  name: String,
  items: [itemSchema] //linking with the itemSchema
};

const List = mongoose.model("List", listSchema);


//---------------------------- DEFAULT ENTRIES AND DISPLAY BY RENDERING THE list.ejs file -----------------------------
app.get("/", function(req, res) {

  //reading the collectinon in DB
  Item.find({}, function(err, foundItems) {
    //here we are using find( find all ) method it gives the array of objects back as result
    //when our items will be found, we will access it in the callback which is referred as foundItems here(an array)

    //we also cannot comment the insertMany method after the default items is added the first time
    //because suppose the server is running from the heroku...then it is not possible

    if (foundItems.length === 0) { //if there are no items in the collection, only then we insert the default items to the collection(this will be the very first time)
      //if not done the above step then each and every time we run the server we will get to see the default items repeated in the collection
      //this also means that our to do list is never gonna be empty

      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items to DB.");
        }
      });
      //we are not rendering any file so we cannot see any thing added to the website so we redirect to "/"
      //now this time the collection won't be empty and we go to else part where the list.ejs file is rendered
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// -------------------------- MANAGING THE LISTS(MAKING DIFFERENT TO DO LIST ROUTES) ------------------------------
// Express route parameters(dynamic route)
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, foundList) {
    //here we are using findOne(search one condition in the collection) method which gives us an object back as result
    if (!err) {
      if (!foundList) { //if we do not get an object in callback means, i.e if there is no list found(list of that name doesn't exist) then below we will create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
        //when redirecting again to that list, now we will have that list in collection and so enter in else part where we render the list.ejs file
      } else { //if the list is found we will show that list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    }
  });
});


//----------------------------------------------- ADDING A TO DO LIST ITEM -----------------------------------------------
app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") { //if we try to add new item to default list then we directly save it there
    item.save(); //new item will be saved in our collection
    res.redirect("/"); //we will redirect to "/" from where our list.ejs file will get rendered
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item); //push the new item in that particular list
      foundList.save(); //save in that particular list
      res.redirect("/" + listName); //we will redirect to that route from where our list.ejs file should get rendered
    })
  }

});

//----------------------------------------------- DELETING A TO DO LIST ITEM -----------------------------------------------
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  //extracting the unique id of the checkbox stored in the checkbox value
  const listName = req.body.listName;

  if (listName === "Today") {
    // "findByIdAndRemove" gets executed(remove) only when it is provided a callback
    //this method finds a document and then remove it
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Succesfully deleted the item.");
        res.redirect("/"); //this is done each item to display the final collection output on the website
      }
    });
  } else {
      //"findOneAndUpdate" finds a document and update it
      //first parameter- find        second parameter- update        third parameter- callback
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        //here we are updating using the "$pull" operator which have the syntax as -
        //$pull: {fromWhere: {what: }} ..... (pull===remove)
        // "$pull" operator removes from an existing array all instances of a value/values that match a specified condition

        if(!err){
          res.redirect("/" + listName);
        }
      });
  }

});



app.get("/about", function(req, res) {
  res.render("about");
});


app.listen(3000 || process.env.PORT, function() {
  console.log("Server started on port successfully");
});
