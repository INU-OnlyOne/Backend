var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json({extended: true})); //사용자가 웹사이트로 전달하는 정보들을 검사>하는 미들웨어
app.use(bodyParser.urlencoded({extended: true})); //json이 아닌 post형식으로올때 파서

// 서버 시작
app.listen(3000, function () {
    console.log('서버 실행 중...');
});

// MySQL 연결 설정
var connection = mysql.createConnection({
    host: "",
    user: "",
    database: "",
    password: "",
    port: 
});

// 유저 대기 걸기
app.post('/user/waiting/insert', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;
    var Waitheadcount = req.body.Waitheadcount;
    var WaitTime = req.body.WaitTime;
    var WaitSeat = req.body.WaitSeat;
    var WaitisAccepted = false;

    // 대기 신청 sql문
    var sql = 'INSERT INTO Waiting (UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) VALUES(?, ?, ?, ?, ?, ?)';
    var params = [UserPhone, resPhNum, Waitheadcount, WaitTime, WaitSeat, WaitisAccepted];

    // sql 문의 ?는 두번째 매개변수로 넘겨진 params의 값으로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '대기 신청이 완료되었습니다.';
        }

        res.json({
            'UserPhone': UserPhone,
            'resPhNum': resPhNum,
            'Waitheadcount': Waitheadcount,
            'WaitTime': WaitTime,
            'WaitSeat': WaitSeat,
            'WaitisAccepted': WaitisAccepted,
            'code': resultCode,
            'message' : message
        });
    });
});

// 대기 내역 삭제
app.delete('/user/waiting/delete', function(req, res) {
    var UserPhone = req.body.UserPhone;
    var params = [UserPhone];

    var sql = 'DELETE FROM Waiting WHERE UserPhone = ? and WaitisAccepted = false';

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '대기 신청이 취소되었습니다.';
        }

        res.json({
            'code': resultCode,
            'UserPhone' : UserPhone,
            'message' : message
        });
    });
});

// 내 앞 대기자 수 확인
// 해당 음식점, 본인 앞에 있는 대기자만 가져옴
// result.length를 구해서 앞에 몇 명이 있는 지 파악
app.post('/user/waiting/waitingnumber', function(req, res) {
    console.log(req.body);
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;

    var sql = 'SELECT * FROM (SELECT * FROM Waiting WHERE (resPhNum = ? AND WaitisAccepted = FALSE) ORDER BY WaitTime) Waiting WHERE WaitTime < (SELECT WaitTime FROM Waiting WHERE UserPhone = ? )';
    var params = [resPhNum, UserPhone];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '현재 ' + result.length + '팀이 앞에 있습니다.';;
            if(result.length == 0) { // WaitisAccepted가 0(false)이면 수락x, 대기중
                message = '현재 ' + result.length + '팀이 앞에 있습니다.';;
            } else if(result == 1) {  // WaitisAccepted가 1(ture)이면 수락o
                message = '입장이 수락되었습니다.';
            }
        }

        res.json({
            'code': resultCode,
            'message' : message,
            'result' : result.length
        });
    });
});

// 입장 수락
// WaitisAccepted를 true(1)로 바꾸고, 해당 내역을 Waited로 복사하기
app.post('/kiosk/accept', function(req, res) {
    console.log(req.body);
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;

    var sql1 = 'UPDATE Waiting SET WaitisAccepted = 1 WHERE UserPhone = ? ADN resPhNum = ?; ';
    var params = [UserPhone, resPhNum];
    var sql2 = 'INSERT IGNORE INTO Waited(UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted) SELECT UserPhone, resPhNum, WaitHeadcount, WaitTime, WaitSeat, WaitisAccepted FROM Waiting WHERE WaitisAccepted = 1;';

    connection.query(sql1 + sql2, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else if(result == 1) {
            resultCode = 200;
            message = '이미 수락되었습니다.';
        } else {
            resultCode = 200;
            message = '입장이 수락되었습니다.';
        }

        res.json({
            'code': resultCode,
            'message' : message
        });
    });
});

// 입장 거절
// 예약 내용 지우기
app.post('/kiosk/reject', function(req, res) {
    console.log(req.body);
    var UserPhone = req.body.UserPhone;
    var resPhNum = req.body.resPhNum;

    var sql = 'UPDATE Waiting SET WaitisAccepted = 0 WHERE UserPhone = ? AND resPhNum = ? ';
    var params = [UserPhone, resPhNum];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = '입장이 거절되었습니다.';
        }

        res.json({
            'code': resultCode,
            'message' : message
        });
    });
});

// 대기 수락 여부 확인
// 사장님 사용 - 수락/거부 요청 날릴 수 있도록
app.post('/user/waiting/acceptreject', function(req, res) {
    console.log(req.body);
    var WaitIndex = req.body.WaitIndex;

    var sql = 'SELECT WaitisAccepted FROM Waiting WHERE WaitIndex = ?';
    var params = [WaitIndex];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            if(result == 0) { // WaitisAccepted가 0(false)이면 수락x, 대기중
                message = '입장 수락 대기중입니다.';
            } else if(result == 1) {  // WaitisAccepted가 1(ture)이면 수락o
                message = '입장이 수락되었습니다.';
            }
        }

        res.json({
            'code': resultCode,
            'message' : message
        });
    });
});

//대기 미루기
//스탬프 1개 사용
app.post('/user/waiting/acceptreject', function(req, res) {
    console.log(req.body);
    var WaitIndex = req.body.WaitIndex;

    var sql = 'SELECT WaitisAccepted FROM Waiting WHERE WaitIndex = ?';
    var params = [WaitIndex];

    connection.query(sql, params, function (err, result) {
        var resultCode = 404;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            if(result == 0) { // WaitisAccepted가 0(false)이면 수락x, 대기중
                message = '입장 수락 대기중입니다.';
            } else if(result == 1) {  // WaitisAccepted가 1(ture)이면 수락o
                message = '입장이 수락되었습니다.';
            }
        }

        res.json({
            'code': resultCode,
            'message' : message
        });
    });
});
