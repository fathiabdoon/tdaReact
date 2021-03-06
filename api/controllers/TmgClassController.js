/**
 * AgencyController
 *
 * @description :: Server-side logic for managing agencies
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var googleapis = require('googleapis');
var fs = require('fs');    
var jwt = new googleapis.auth.JWT(
		'424930963222-s59k4k5usekp20guokt0e605i06psh0d@developer.gserviceaccount.com', 
		'availwim.pem', 
		'3d161a58ac3237c1a1f24fbdf6323385213f6afc', 
		['https://www.googleapis.com/auth/bigquery']
	);
jwt.authorize();	
var bigQuery = googleapis.bigquery('v2');

module.exports = {
	
	byHour:function(req,res){
		var database = req.param('database'),
 			station = req.param('stationId'),
 			fips = req.param('fips')
 			output = {};

 		fileCache.checkCache({datasource:database,type:'stationClassByHour',typeId:fips+station},function(data){
 			//console.log('find cache',data);
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
 				res.send(data)
 				console.timeEnd('send cache');
 			}else{
			    var sql = 'SELECT '+ 
				  'station_id,dir,year,month,day,hour, '+
				  'sum(total_vol),sum(class1),sum(class2),'+
				  'sum(class3),sum(class4),sum(class5),sum(class6),'+
				  'sum(class7),sum(class8),sum(class9),sum(class10),sum(class11),sum(class12),sum(class13) '+
				  "FROM [tmasWIM12."+database+"Class] where state_fips = '"+fips+"' and station_id = '"+station+"' "+
				  'group by station_id,dir,year,month,day,hour '+
				  'order by station_id,dir,year,month,day,hour ';
				
				//console.log('by hour',sql)
				BQuery(sql,function(data){

					var fullData = data.rows.map(function(row,index){
						var outrow = {}
						
						data.schema.fields.forEach(function(field,i){
							outrow[field.name] = row.f[i].v;
						});
						return outrow;
					});
					console.time('send Data');
					res.json(fullData);
					console.timeEnd('send Data');
					console.log('caching');
					fileCache.addData({datasource:database,type:'stationClassByHour',typeId:fips+station},fullData);
				});

			}
 	
		});
	},

	byMonth:function(req,res){
		var database = req.param('database'),
 			fips = req.param('fips'),
 			output = {};

 		fileCache.checkCache({datasource:database,type:'classByMonth',typeId:fips},function(data){
 			//console.log('find cache',data);
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
 				res.send(data)
 				console.timeEnd('send cache');
 			}else{
			    var sql = 'SELECT '+ 
				  'station_id,dir,year,month,count(distinct day) as numDays,'+
				  'sum(total_vol),sum(class1),sum(class2),'+
				  'sum(class3),sum(class4),sum(class5),sum(class6),'+
				  'sum(class7),sum(class8),sum(class9),sum(class10),sum(class11),sum(class12),sum(class13) '+
				  "FROM [tmasWIM12."+database+"Class] where state_fips = '"+fips+"' "+
				  'group by station_id,dir,year,month '+
				  'order by station_id,dir,year,month'
				
				BQuery(sql,function(data){

					var fullData = data.rows.map(function(row,index){
						var outrow = {}
						
						data.schema.fields.forEach(function(field,i){
							outrow[field.name] = row.f[i].v;
						});
						outrow['single_day'] = outrow.station_id +'-'+ outrow.year+'-'+outrow.month
						return outrow;
					});
					console.time('send Data');
					res.json(fullData);
					console.timeEnd('send Data');
					console.log('caching');
					fileCache.addData({datasource:database,type:'classByMonth',typeId:fips},fullData);
				});

			}
 	
		})
	},

	byDay:function(req,res){
 		var database = req.param('database'),
 			fips = req.param('fips'),
 			output = {};
 		
 		fileCache.checkCache({datasource:database,type:'classByDay',typeId:fips},function(data){
 			//console.log('find cache',data);
 			if(data){
 				console.log('cache sucess');
 				console.time('send cache');
 				res.send(data)
 				console.timeEnd('send cache');
 			}else{
			    var sql = 'SELECT station_id,dir,year,month,day,'
		    			+'sum(total_vol),sum(class1),sum(class2),'
		    			+'sum(class3),sum(class4),sum(class5),sum(class6),'
		    			+'sum(class7),sum(class8),sum(class9),sum(class10),'
		    			+'sum(class11),sum(class12),sum(class13) '
		    			+"FROM [tmasWIM12."+database+"Class] where state_fips = '"+fips+"' "
		    			+'group by station_id,dir,year,month,day'
						'order by station_id,dir,year,month,day';
				
				BQuery(sql,function(data){

					var fullData = data.rows.map(function(row,index){
						var outrow = {}
						
						data.schema.fields.forEach(function(field,i){
							outrow[field.name] = row.f[i].v;
						});
						outrow['single_day'] = outrow.station_id +'-'+ outrow.year+'-'+outrow.month+'-'+outrow.day
						return outrow;
					});
					console.time('send Data');
					res.json(fullData);
					console.timeEnd('send Data');
					console.log('caching');
					fileCache.addData({datasource:database,type:'classByDay',typeId:fips},fullData);
				});

			}
 	
		})
 	},

};

function BQuery(sql,cb){

	var output = {};
	console.time('TmgClassController - byDay - query');
    
	var request = bigQuery.jobs.query({
    	kind: "bigquery#queryRequest",
    	projectId: 'avail-wim',
    	timeoutMs: '10000',
    	resource: {query:sql,projectId:'avail-wim'},
    	auth: jwt
    },
    function(err, response) {
  		if (err) console.log('Error:',err);
  		console.timeEnd('TmgClassController - byDay - query');
    	if(response.rows){
	    	console.log(response.rows.length,response.totalRows)
	    	
      		output = response;
			

			if(output.rows.length < output.totalRows){
					
				getMoreRows(output.jobReference.jobId,output.rows.length)
			
			}else{
	
				console.log('finished');
	
				cb(output);
			}

			//getMoreRows(response.jobReference.jobId,output.length)

			function getMoreRows(jobid,startLine){

				console.log('get more rows',jobid,startLine);
				
				var params = {jobId:jobid,projectId:'avail-wim',startLine:startLine,auth: jwt};
				bigQuery.jobs.getQueryResults(params,function(err,data){

					if(err){
						console.log('get more rows error',err);
					}

					console.log('get more rows/data returned');
					if(typeof data.rows == 'undefined'){
						console.log('error probably',data);
					}
					
					//console.log(data);
					console.log('data2',data.rows.length,data.pageToken,data.jobReference);
					data.rows.forEach(function(data){
						output.rows.push(data);
					});

					if(output.rows.length < output.totalRows){
					
						getMoreRows(jobid,output.rows.length)
					
					}else{
			
						
			
						
      					
						cb(output);
					}

				});
			}

      	}else{
      		cb({rows:[],schema:[]})
      	}
  		
    });
}


var fileCache = {
	
	cache : {},

	checkCache : function(request,callback){
		console.log('------------checkCache----'+request.datasource+'---'+request.type+request.typeId+'----------------')
		var file = __dirname.substring(0,__dirname.length-15) + 'assets/cache/'+request.datasource+'/'+request.type+request.typeId+'.json';
		
		//console.log(file,callback);
		console.time('file Read')
		fs.readFile(file, 'utf8', function (err, data) {
		  if (err) {
		    console.log('Error: ' + err);
		    return callback(false);
		  }
		 		 
		  console.timeEnd('file Read');
		  data = JSON.parse(data);
		  return callback(data);
		
		});

	},

	addData : function(request,data){
		var dir = __dirname.substring(0,__dirname.length-15) + 'assets/cache/'+request.datasource+'/';

		ensureExists(dir, 0744, function(err) {
		    if (err){
		    	console.log('ensure exists error')
		    } // handle folder creation error
		    var file = dir+request.type+request.typeId+'.json';
		    
		    fs.writeFile(file,JSON.stringify(data), function(err) {
			    if(err) {
			        console.log('file write error',err);
			    } else {
			        console.log("The file was saved!",file);
			    }
			});
		
		});

	}


};

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}