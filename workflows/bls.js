module.exports = async function ({helpers}){
	const teableUrl = "https://app.teable.io/api/table/tblsWx24MUhM7JxkMNx/record";
	helpers.axios.get(teableUrl, { headers: { "Authorization": `Bearer ${{secrets.TEABLE_KEY}}` } })
	.then((response) => {
		const records = response.records;
        records.forEach(record => {
            record.fields.forEach(field => {
                if (field.hourlySeriesId) {
                    helpers.axios.get(
                        `https://api.bls.gov/publicAPI/v2/timeseries/data/${field.hourlySeriesId}?latest=true&registrationkey=${{ secrets.BLS_KEY }}`
                    ).then(function (response) {
                        const hourlyWage = response.Results.series[0]?.data[0]?.value;
                        helpers.axios.patch( teableUrl, { hourlyWage: hourlyWage }, { headers: { "Authorization": `Bearer ${{ secrets.TEABLE_KEY }}` }});
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