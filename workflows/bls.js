module.exports = async function ({helpers}){
	console.log('XXXXXXXXXX');
	const env_secrets = JSON.parse(process.env['INPUT_JSON-SECRETS']);
	console.log(env_secrets.TEABLE_KEY);
	const teableUrl = "https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record";
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` } })
	.then((response) => {
		const records = response.records;
        records.forEach(record => {
            record.fields.forEach(field => {
                if (field.hourlySeriesId) {
                    helpers.axios.get(
                        `https://api.bls.gov/publicAPI/v2/timeseries/data/${field.hourlySeriesId}?latest=true&registrationkey=${env_secrets.BLS_KEY}`
                    ).then(function (response) {
                        const hourlyWage = response.Results.series[0]?.data[0]?.value;
                        helpers.axios.patch( teableUrl, { hourlyWage: hourlyWage }, { headers: { "Authorization": `Bearer ${env_secrets.TEABLE_KEY}` }});
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                }
            })
        });
	}).catch(function (error){
		console.log(error);
	});
};