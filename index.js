const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');


const app = express();
var ExifImage = require('exif').ExifImage;

app.set('view engine', 'ejs');
mongoose.connect("mongodb+srv://vidisha:vidisha@cluster0.bptyr.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true,useUnifiedTopology: true}).then(() => {
console.log('MongoDB is connected')
}).catch(err => {
        console.log(err)
    })

const ImageData = require('./models/imageData')
const User = require('./models/user');
const imageData = require('./models/imageData');

app.use(express.static(path.join(__dirname, './public/')));
app.use(express.urlencoded({ extended: false }));
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, './public/uploads'))
    },
    filename: function(req, file, cb) {
        var fileName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
        try {
            //console.log("entered");
            new ExifImage({ image: path.join('public/uploads/', fileName) }, function(error, exifData) {
                if (error) {
                    console.log('Error: ' + error.message);
                } else {
                    exifData.path = path.join('public/uploads/', fileName);
                    const newImage = new ImageData(exifData);
                    newImage.save().then(item => res.redirect('/loggedIn'));
                }
            });
        } catch (error) {
            console.log('Error: ' + error.message);
        }
        cb(null, fileName);
    }
});
//init upload
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('myImage');

function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

app.get('/', (req, res) => {
    var msg = '';
    var msgTop = '';
    res.render('index.ejs', { msgTop, msg });
});
app.get('/loggedIn', function(req, res) {
    var msg='';
    res.render('logged.ejs',{msg});
});
app.post('/loggedout',(req,res) => {
	res.redirect('/')
});
app.post('/upload', (req, res) => {
    var async_func = async function(req, res) {
        upload(req, res, (err) => {
            if (err) {
		var searchmsg='';
                res.render('logged', {
                    msg: err,
		    searchmsg:'Error:Please upload jpeg image and try again'
                });
            } else {
                if (req.file == undefined) {
                    var searchmsg='';
                    res.render('logged', {
                        searchmsg: 'Error: No File Selected!'
                    });
                } else {
                    //console.log(req.file);
                    var searchmsg='';
                    res.render('logged', {
                        searchmsg: 'File Uploaded!',
                        file: `uploads/${req.file.filename}`
                    });

                }
            }
        });
    }
    async_func(req, res);
});

app.get('/addImage', function(req, res) {
    res.render('addimages.ejs');
});

app.post('/item/auth', (req, res) => {
    var uname = req.body.name;
    var pass = req.body.prop;
	var searchmsg='';
    if (uname == "guest" && pass == "guest") {
        return res.render('logged.ejs',{searchmsg});
    } else {
        User.count({ name: uname, pass: pass }, function(err, count) {
            if (count > 0) {
                //document exists });
                return res.render('logged.ejs',{msg});
            } else {
                var msgTop = 'Invalid Username/Password';
                var msg = '';
                return res.render('index.ejs', { msgTop, msg });
            }
        });
    }
});
app.post('/item/addUser', (req, res) => {
    const newUser = new User({
        name: req.body.name,
        pass: req.body.pass
    });
    var uname = req.body.name;
    User.count({ name: uname }, function(err, count) {
        if (count > 0) {
            //document exists });
            var msgTop = '';
            var msg = 'Username Already Taken!!'
            return res.render('index', { msgTop, msg });
        } else {
            newUser.save().then(user => res.redirect('/'));
        }
    });
});
app.post('/item/Add', (req, res) => {
    const newItem = new Item({
        name: req.body.name,
        prop: req.body.prop
    });
    path.join('public/uploads/', file.originalname)
    newItem.save().then(item => res.redirect('/loggedIn'));
});
app.post('/item/authAdmin', (req, res) => {
    var uname = req.body.name;
    var pass = req.body.prop;
    if (uname == 'admin' && pass == 'admin') {
        res.redirect('/loggedIn');
    } else {
        res.redirect('/');
    }
});

app.post('/find', (req, res) => {
    ImageData.find({}, function(err, docs) {
        if (err) { res.json(err); } else {
            var name1 = req.body.name1;
            var name2 = req.body.name2;
            var prop = req.body.prop;
            var customname=req.body.custom_name;
            var result = [];
            var searchmsg='';
            if (name2 == "") {
                if(customname == ""){
                
                	docs.forEach((doc) => {
                	    var ob = JSON.parse(JSON.stringify(doc));
                	    if (ob[name1] == prop) {
                	        result.push(String(ob['path']).substr(7));
                	    }
                	});
                	console.log(result);
					if(result.length==0){
						searchmsg = 'Cannot find images with these inputs, please retry.';
						var msg='';
						return res.render('logged.ejs',{searchmsg,msg});
					}
				}
				else{
					docs.forEach((doc) => {
                	    var ob = JSON.parse(JSON.stringify(doc));
                	    if (ob[customname] == prop) {
                	        result.push(String(ob['path']).substr(7));
                	    }
                	});
                	console.log(result);
					if(result.length==0){
						searchmsg = 'Cannot find images with these inputs, please retry.';
						var msg='';
						return res.render('logged.ejs',{searchmsg,msg});
					}
				}
            } else {
                docs.forEach((doc) => {
                    var ob = JSON.parse(JSON.stringify(doc));
                    if (ob[name1][name2] == prop) {
                        result.push(String(ob['path']).substr(7));
                    }
                });
			    if(result.length==0){
				  searchmsg = 'cannot find images with these inputs, please retry';
				  var msg='';
				  return res.render('logged.ejs',{searchmsg,msg});
			    }
			    console.log(result);
            }
            res.render('list', { items: result, layout: false });
        }
    });
});;

app.post('/listall', (req, res) => {
    ImageData.find({}, function(err, docs) {
        if (err) { res.json(err); } else {
             var result = [];
         	docs.forEach((doc) => {
                    var ob = JSON.parse(JSON.stringify(doc));
                    result.push(String(ob['path']).substr(7));
                    
        	});
            //console.log(result);

            res.render('list', { items: result, layout: false });
        }
    });
});;

app.listen(3000, () => console.log('Server listening on port 3000'));
