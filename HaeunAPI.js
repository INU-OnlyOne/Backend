
//ㅇㅇ구 음식점 정보 가져오는 API (수정 0412)
app.post('/restaurants', function (req, res) {
  var resAddress = req.body.resAddress;
  resAddress = '%'+resAddress+'%'
  console.log(resAddress, typeof(resAddress));
  var sql = 'select * from Restaurants where resAddress like ?';
  connection.query(sql, [resAddress], function (err, results) {
    if (err)
        console.log(err);
    else {
        if (results.length == 0) {

        } else {
        res.json({
            results
        });
        }
         }
     });
});

//ㅇㅇ구 음식점 카테고리 정보 가져오는 API 
app.post('/restaurants/category', function (req, res) {
  var resAddress = req.body.resAddress;
  resAddress = '%'+resAddress+'%'
  var resCategory = req.body.resCategory;
  console.log(resAddress, typeof(resAddress));
  var sql = 'select * from Restaurants where resAddress like ? and resCategory = ?';
  connection.query(sql, [resAddress, resCategory], function (err, results) {
    if (err)
        console.log(err);
    else {
        if (results.length == 0) {

        } else {
        res.json({
            results
        });
        }
         }
     });
});

// 레스토랑 id로 정보 가져오기
app.post('/restaurant/id', function (req, res) {
    var ResID = req.body.ResID;

    var sql = 'select * from Restaurants where resIdx=?';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.send(result)
    })
});

// 음식점 이름으로 음식점 정보 가져오는 API
app.post('/restaurant/name', function (req, res) {
  var resName = req.body.resName;
  resName = '%'+resName+'%'
  console.log(resName, typeof(resName));
  var sql = 'select * from Restaurants where resName like ?';
  connection.query(sql, [resName], function (err, results) {
    if (err)
        console.log(err);
    else {
        if (results.length == 0) {

        } else {
        res.json({
            results
        });
        }
         }
     });
});

// 리뷰 등록
const upReviewImg = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "postImage/review"));
    },
  }),
});

const uploadMiddlewareRev = upReviewImg.single("myFile");

app.post('/review', uploadMiddlewareRev, function (req, res) {
    var UserID = req.body.UserID;
    var ResID = req.body.ResID;
    var Rating = req.body.Rating;
    var RevTxt = req.body.RevTxt;
    var RevKeyWord =  req.body.RevKeyWord;
    var RevSatis = req.body.RevSatis;
    var RevRecom = req.body.RevRecom;
    var RevTime = req.body.RevTime;
    var ImgPath = '';

    // Check if image file exists
    if (req.file) {
        ImgPath = req.file.filename;
    }

    var sql1 = 'insert into Reviews (UserID, ResID, Rating, RevTxt, RevKeyWord, RevSatis, RevRecom, RevTime, RevImg) values (?, ?, ?, ?, ?, ?, ?, ?, ?);';
    var sql2 = 'update Reviews join Users on Reviews.UserID = Users.UserID set Reviews.UserName = (select UserName from Users where Users.UserID=?) where Reviews.UserID = ?;';
    var params1 = [UserID, ResID, Rating, RevTxt, RevKeyWord, RevSatis, RevRecom, RevTime, ImgPath];
    var params2 = [UserID, UserID];
    sql1 = mysql.format(sql1,params1);
    sql2 = mysql.format(sql2, params2);
    connection.query(sql1, function (err1, result1) {
        if (err1) {
            console.log(err1);
            res.json({
                'message': '에러 발생'
            });
            return;
        }
        connection.query(sql2, function (err2, result2) {
            if (err2) {
                console.log(err2);
                res.json({
                    'message': '에러 발생'
                });
                return;
            }
            res.json({
                'UserID': UserID,
                'ResID': ResID,
                'Rating': Rating,
                'RevTxt': RevTxt,
                'RevKeyWord': RevKeyWord,
                'RevSatis' : RevSatis,
                'RevRecom' : RevRecom,
                'RevTime' : RevTime,
                'ImgPath' : ImgPath,
                'message': '리뷰 등록 성공'
            });

            // Update the number of reviews for the restaurant
            var sql3 = 'update Restaurants join Reviews on Restaurants.resIdx = Reviews.ResID set Restaurants.revCnt = (select count(Reviews.RevIdx) from Reviews where Reviews.ResID=?) where Restaurants.resIdx = ?';
            var params3 = [ResID, ResID];
            sql3 = mysql.format(sql3, params3);

            connection.query(sql3, function (err3, result3) {
                if (err3) {
                    console.log(err3);
                    return;
                }
                console.log("Number of reviews updated for restaurant");

            });

            // Update the rating of the restaurant
            var sql4 = 'update Restaurants join Reviews on Restaurants.resIdx = Reviews.ResID set Restaurants.resRating = (select avg(Rating) from Reviews where Reviews.ResID=?) where Restaurants.resIdx = ?';
            var params4 = [ResID, ResID];
            sql4 = mysql.format(sql4, params4);

            connection.query(sql4, function (err4, result4) {
                if (err4) {
                    console.log(err4);
                    return;
                }
                console.log("Rating updated for restaurant");

            });
        });
    });
});

// 레스토랑 별 리뷰
app.post('/restaurant/reviews', function (req, res) {
    var ResID = req.body.ResID;

    var sql = 'select * from Reviews where ResID=?';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.json({
            result
        });
    });
});

// 리뷰 이미지 이름 가져오기
app.post('/review/image', function (req, res) {
    var RevIdx = req.body.RevIdx;

    var sql = 'select RevImg from Reviews where RevIdx=?';
    var params = RevIdx;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.json({
            'RevIdx' : RevIdx,
            result
        });
    });
});

// 레스토랑  이미지 업로드
const upResImg = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "postImage/restaurant"));
    },
  }),
  limits: { fileSize: 1024 * 1024 },
});

const uploadMiddlewareRes = upResImg.single("myFile");

app.post("/upload/restaurant/image", uploadMiddlewareRes, (req, res) => {
    var ImgPath = req.file.filename;
    var resIdx = req.body.resIdx;

    var sql = 'UPDATE Restaurants SET resImg=? WHERE resIdx=?';

    var params = [ImgPath, resIdx];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '이미지 업로드 실패';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '이미지 업로드 성공';
        }
        res.json({
            'ImgPath': ImgPath,
            'resIdx' : resIdx,
            'message': message
        });
    });
});

// 리뷰 이미지 이름 가져오기
app.post('/review/image', function (req, res) {
    var RevIdx = req.body.RevIdx;

    var sql = 'select RevImg from Reviews where RevIdx=?';
    var params = RevIdx;

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러 발생';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = result;
        }

        res.json({
            'RevIdx' : RevIdx,
            result
        });
    });
});

// 성별별 선호도
app.post('/restaurant/gender', function (req, res) {
    var ResID = req.body.ResID;
    var Mcnt = 0;
    var Fcnt = 0;

    var sql = 'SELECT UserGender FROM Users WHERE UserID IN (SELECT UserID FROM Reviews WHERE ResID=3 AND RevSatis=1);';
    var params = ResID;

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            res.json({
                'message': '에러 발생'
            });
            return;
        }

        result.forEach(function (row) {
            if (row.UserGender === 'M') {
                Mcnt++;
            } else if (row.UserGender === 'F') {
                Fcnt++;
            }
        });

        res.json({
            'ResID': ResID,
            'cntM': Mcnt,
            'cntF': Fcnt,
            'message': '성별별 선호도'
        });
    });
});

// 연령별 선호도
app.post('/restaurant/age', function (req, res) {
    var ResID = req.body.ResID;
    var cnt10 = 0;
    var cnt20 = 0;
    var cnt30 = 0;
    var cnt40 = 0;
    var cnt50 = 0;

    var sql = 'SELECT UserBirth FROM Users WHERE UserID IN (SELECT UserID FROM Reviews WHERE ResID=? AND RevSatis=1);';
    var params = [ResID];

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
            res.json({
                'message': '에러 발생'
            });
            return;
        }

        result.forEach(function (row) {
            var birthYear = String(row.UserBirth.getFullYear()).substr(0, 4);
            var currentYear = new Date().getFullYear();
            var age = (currentYear+1) - parseInt(birthYear, 10);
            if (age < 20) {
                cnt10++;
            } else if (age < 30) {
                cnt20++;
            } else if (age < 40) {
                cnt30++;
            } else if (age < 50) {
                cnt40++;
            } else {
                cnt50++;
            }
        });


        res.json({
            'ResID': ResID,
            'cnt10': cnt10,
            'cnt20': cnt20,
            'cnt30': cnt30,
            'cnt40': cnt40,
            'cnt50': cnt50,
            'message': '연령별 선호도'
        });
    });
});

// 키오스크 레스토랑 정보 수정
app.post('/kiosk/information/modify', function (req, res) {
    var resIdx = req.body.resIdx;
    var updateColumns = [
        {name: 'resMngNum', value: req.body.resMngNum},
        {name: 'resName', value: req.body.resName},
        {name: 'resAddress', value: req.body.resAddress},
        {name: 'resCategory', value: req.body.resCategory},
        {name: 'resPhNum', value: req.body.resPhNum},
        {name: 'resPwd', value: req.body.resPwd},
        {name: 'resSeat', value: req.body.resSeat},
        {name: 'resSeatCnt', value: req.body.resSeatCnt},
        {name: 'keyWord', value: req.body.keyWord},
        {name: 'ResComment', value: req.body.ResComment},
        {name: 'resOpen', value: req.body.resOpen},
        {name: 'resClose', value: req.body.resClose},
        {name: 'resWaitOpen', value: req.body.resWaitOpen},
        {name: 'resWaitClose', value: req.body.resWaitClose}
    ];

    // 기존 데이터베이스의 값 select
    var selectSql = `SELECT * FROM Restaurants WHERE resIdx = ${resIdx}`;
    connection.query(selectSql, function (err, rows, fields) {
        if (err) {
            console.log(err);
            res.json({
                'message': '에러 발생'
            });
            return;
        }

        var currentData = rows[0];

        // updateColumns에 값이 있으면 그 값으로 대체
        updateColumns.forEach(column => {
            if (column.value !== undefined) {
                currentData[column.name] = column.value;
            }
        });

        // keyWord는 JSON 문자열로 저장
        if (currentData.keyWord !== undefined && !Array.isArray(currentData.keyWord)) {
            currentData.keyWord = JSON.parse(currentData.keyWord);
        }

        if (Array.isArray(currentData.keyWord)) {
            currentData.keyWord = JSON.stringify(currentData.keyWord);
        }

        var sql = `UPDATE Restaurants SET ? WHERE resIdx = ${resIdx}`;
        connection.query(sql, [currentData], function (err, result) {
            if (err) {
                console.log(err);
                res.json({
                    'message': '에러 발생'
                });
                return;
            }

            currentData['message'] = '레스토랑 정보 수정 성공';
            res.json(currentData);
        });
    });
});
