
var mongo = require('mongodb');
var crypto = require('crypto');
var secretkey = 'ZPL6VOsrtyjTXq7h02qYeh3B93qqJhpX';
var get_hash = function(state, ts){
	var text = state + ts + secretkey;
	hmac = 	crypto.createHmac("sha256", secretkey);
	hmac.setEncoding('base64');
	hmac.write(text);
	hmac.end();
	hash = hmac.read();
	return hash;
	
}
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server('ds063240.mongolab.com',63240,{auto_reconnect: true});
db = new Db('gumball', server);


db.open(function(err, db) {
	db.authenticate('root', 'admin', function(err, success) {
		if(!err) {
	        console.log("Connected to 'gumballdb' database");
	        db.collection('gumballs', {strict:true}, function(err, collection) {
	            if (err) {
	                console.log("The 'gumballs' collection not exists.");
	                populateDB();
	            }
	        });
	    }
    });
    
});

exports.turnCrank = function(req, res){
	var input = JOSN.parse(JSON.stringify(req.bosy));
	
}
exports.inventory = function(req, res)
 {
	    db.collection('gumballs', function(err, collection) {
	        collection.find().toArray(function(err, items) {
	        	 res.render('inventory', {result:items});
	        });
	    });
	
};

exports.getMachineInfo = function(req,res) 
 {
    var id = req.params.id;
    console.log('Retrieving gumball: ' + id);
    db.collection('gumballs', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
        	var state = 'No Coin';
        	var ts = new Date().getTime();
        	var hash = get_hash(state, ts)
        	res.render('getMachineInfo', {result:item, _id: id, state:state, hash : hash, ts : ts, Msg:'Please Insert Coin'});
        });
    });
};

exports.newMachineInfo = function(req, res)
{
    var gumball = req.body;
    console.log('Adding gumball: ' + JSON.stringify(gumball));
    db.collection('gumballs', function(err, collection) {
        collection.insert(gumball, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}




exports.updateMachineInfo = function(req, res) 
{
	var id = req.params.id;
	var input = JSON.parse(JSON.stringify(req.body));
	var state = input.state;
	var event = input.event;
	var hash1 = input.hash;
	var ts = parseInt(input.ts);
	console.log(hash +" ***" +state +"***"+ts);
	var now = new Date().getTime();
	var diff = ((now-ts)/1000);
	var hash2 = get_hash(state, ts);
	console.log(hash2 +" &&&" +state +"&&&"+ts);
	console.log("Diff" + diff);
	console.log("Hash1" + hash1);
	console.log("Hash2" + hash2);
	var data = {
			id : id,
			serialNumber : input.serialNumber,
			modelNumber : input.modelNumber,
			count : input.count
	}
	
	if(diff > 120){
		res.render('getMachineInfo', {result:data, _id:id, state:state, ts : now, hash : hash, Msg:'******Session Invalid*******'} );
	}
	
	console.log(data);
	if(event=="Insert Quarter"){
		if(state=="No Coin"){
			var nstate = "Has Coin";
			var nhash = get_hash(state, now);
			console.log(nhash +" ###" +nstate +"###"+now);
			res.render('getMachineInfo', {result:data, _id:id, state:nstate, ts : now, hash : nhash, Msg:'Coin Inserted'});
		}
		else{
			res.render('getMachineInfo', {result:data, _id:id, state:state, ts : now, hash : get_hash(state, now), Msg:'Coin already Inserted'});
		}
			
	}
	else{
		if(state=="No Coin"){
			res.render('getMachineInfo', {result:data, _id:id, ts : now, state:state, hash : get_hash(state, now),  Msg:'Please Insert Coin'})
		}
		else if(state=="Has Coin"){
			if(input.count > 0){
				var dataNew = {
						serialNumber : input.serialNumber,
						modelNumber : input.modelNumber,
						count : input.count-1
				}
				
				db.collection('gumballs', function(err, collection) {
			        collection.update({'_id':new BSON.ObjectID(id)}, dataNew, {safe:true}, function(err, result) {
			            if (err) {
			                console.log('Error updating gumball: ' + err);
			                res.send({'error':'An error has occurred'});
			            } else {
			                console.log('' + result + ' document(s) updated');
			                
			                res.render('getMachineInfo', {result:dataNew, _id:id, ts : now, state:'No Coin', hash : get_hash('No Coin', now), Msg:'Please Collect gumball'});
			            }
			        });
			    });
			}
			else {
				res.render('getMachineInfo', {result:data, _id : id, ts : now, hash : get_hash(state, now), state:state, Msg:'Inventory Zero'});
			}
			
		}
	}
	
	
//   
}
	


exports.deletegumballMachine = function(req, res) {
    var id = req.params.id;
    console.log('Deleting gumball: ' + id);
    db.collection('gumballs', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

var populateDB = function() {

    var gumballs = [
    {
        serialNumber : "543215432112345",
        modelNumber : "98765432",
        count : 15
    },
    {
        serialNumber : "123999123888999",
        modelNumber : "34567892",
        count : 20
    },
    {
        serialNumber : "88899912345667",
        modelNumber : "53124568",
        count : 25
    }
    
    ];

    db.collection('gumballs', function(err, collection) {
        collection.insert(gumballs, {safe:true}, function(err, result) {});
    });
};






