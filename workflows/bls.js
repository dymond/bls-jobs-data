module.exports = async function ({helpers}){
	const chunks = (array, size) =>
    Array.from(
        new Array(Math.ceil(array.length / size)), (_, i) => array.slice(i * size, i * size + size)
    );
	const env_secrets = JSON.parse(process.env['INPUT_JSON-SECRETS']);
	const blsUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
	const teableUrl = 'https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record';
	let allSeriesIds = [];
	let allSeriesWithIds = [];
	let teableData = [];
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` } })
	.then(async (response) => {
		const records = response.data.records;
		for (const record of records) {
			const recordId = record.id;
			const degreeData = record.fields;
			for (const key of Object.keys(degreeData)) {
				if (key === 'hourlySeriesId' || key === 'annualSeriesId') {
					if (degreeData[key]) {
						const code = degreeData['degreeCode'];
						const seriesId = degreeData[key];
						allSeriesIds.push(seriesId);
						allSeriesWithIds.push({recordId:recordId, degreeCode:code, seriesId:seriesId});
					}
				}
			}
		}
	}).catch(function (error){
		console.log(error);
	}).then(function (result) {
		chunks(allSeriesIds,50).forEach((chunk) => {
			helpers.axios.post(
				blsUrl,
				{ "seriesid": Object.values(chunk), "registrationkey": env_secrets.BLS_KEY2, latest:true }
			).then(function (response){
				if (response.status === 200) {
					const series = response.data.Results.series;
					series.forEach((entry) => {
						console.log(entry);
						allSeriesWithIds.find(function(x) {
							console.log(x.seriesId, entry.seriesID);
							if( x.seriesId === entry.seriesID) {

							}
						});
						console.log(seriesObj);
						if ( seriesObj.degreeCode ) {
							if (entry.seriesID.slice(-2) === '08') {
								teableData.push({"id":seriesObj.recordId, "fields":{"hourlyWage": entry.data[0]?.value}});
							}
							if (entry.seriesID.slice(-2) === '13') {
								teableData.push({"id":seriesObj.recordId, "fields":{"annualWage": entry.data[0]?.value}});
							}
						}
					});
				}
			}).catch(function (error){
				console.log(error);
			}).then(function () {
				const newSeriesData = {"fieldKeyType":"name","records":teableData};
				helpers.axios.patch( teableUrl, newSeriesData, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` }})
				.then(function (response){
					console.log(response);
				})
				.catch(function (error){
					console.log(error);
				});
			});
		});
	});

};