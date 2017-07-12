let app = angular.module('app', ['ui.bootstrap', 'ngAria']);

/* movies.json loading service */
app.service('dataFile', ["$http", "$q", function($http, $q) {
	var deferred = $q.defer();
	$http.get("movies.json").then(function(data) {
		deferred.resolve(data);
	});
	this.getMovies = function() {
		return deferred.promise;
	}
}]);


/* MOVIE CARD CODE */
app.controller('iconCtrl', ["$scope", "dataFile", function($scope, dataFile, $uibModal, $log, $document) {
	//load movies data from dataFile service
	var promise = dataFile.getMovies();
	promise.then(function(data){
		$scope.movies = data.data;
	});

	//settings for uib rating
	//ng-model is set in html through ng-init
	$scope.isReadonly = true;

}]);


/* CHART CODE */
//chart controller
app.controller('chartCtrl', ["$scope", "dataFile", function($scope, dataFile){
	//load movies data from dataFile service
	var promise = dataFile.getMovies();
	promise.then(function(data) {
		$scope.movies = data.data;
	});
}]);

//chart directive
app.directive('scatterChart', function() {
	function link(scope, element, attr) {
		//define chart constants
		let svg = d3.select(element[0])
					.append("svg")
					.attr("height", "350px")
					.attr("width", "600px");
		let margin = {top: 50, right: 80, bottom: 40, left: 50},
			width = 600 - margin.left - margin.right,
			height = 350 - margin.top - margin.bottom,
			g = svg.append("g").attr("transform", "translate(" + margin.left + "," +margin.top + ")");	
		//define time format
		let parseDate = d3.timeParse("%d-%m-%y");
		//define scales
		let x = d3.scaleTime().range([0, width]),
			y = d3.scaleLinear().range([height, 0]);

		//define chart title
		let title = svg.append("g")
			.attr("class", "chart-title");
		title.append("text")
			.attr("x", (width/5.5))
			.attr("y", 30)
			.style("font", "18px Merriweather")
			.text("How do these films rate?");

		scope.$watch('data', function(data) {
			if(!data) { return; }
			//load and parse data from scope
			data.forEach(function(d) {
				d.dateWatched = parseDate(d.dateWatched);
				d.rating = +d.rating;
				d.title = d.title;
			});

			//define domains
			x.domain(d3.extent(data, function(d) { return d.dateWatched; }));
			y.domain([0, 5]);

			//define x axis
			g.append("g")
				.attr("class", "axis axis-x")
				.attr("transform", "translate(0," + height + ")")
				.style("stroke-width", 1)
				.call(d3.axisBottom(x));

			//define y axis 
			g.append("g")
				.attr("class", "axis axis-y")
				.style("stroke-width", 1)
				.call(d3.axisLeft(y))
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", -40)
				.attr("x", -110)
				.attr("fill", "#000")
				.text("Ratings");

			//define tooltip behavior
			let mouseover = function(d) {
				g.append("g")
				.append("text")
				.attr("class", "titles")
				//date values were being evaluated as NaN, opted for mouse location event
				.attr("x", (d3.event.pageX - 50) + "px")
				.attr("y", function() { return y(d.rating) - 5; })
				.style("fill",  "#000")
				.style("font-size", "14px")
				//show movie title
				.text(function() { return d.title; });
			};

			//append circles to svg
			g.selectAll(".dot")
				.data(data)
				.enter()
				.append("circle")
				.attr("class", "dot")
				.attr("r", 6)
				.attr("cx", function(d) { return x(d.dateWatched); })
				.attr("cy", function(d) { return y(d.rating); })
				.style("fill", "#d95f0e")
				//define tooltip events 
				.on("mouseover", mouseover)
				.on("mouseout", function() { d3.selectAll(".titles").style("display", "none"); });


		}, true);
	};
	return {
		link: link,
		restrict: 'E',
		scope: {data: '='}
	};
});