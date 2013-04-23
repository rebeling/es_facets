function FetchCtrl($scope, $http, $templateCache) {

    $scope.def_operator = true;
    $scope.toggle = function() { $scope.def_operator = !$scope.def_operator; };

    $scope.searchterm = "";
    $scope.facet_collector = {};
    $scope.filter_terms = {};

    $scope.query_data = "";


    // check es status on start
    $http.get('http://33.33.33.33:9200')
        .success(function (data) {
            if (data.status === 200) {
                $scope.dbStatus = data.name + ' is on.';
            } else {
                $scope.dbStatus = 'response status ' + data.status;
            }
        })
        .error(function(data) {
            $scope.dbStatus = 'no connection to es.';
    });


    $scope.searchurl = 'http://33.33.33.33:9200/_search';
    $scope.header = {'headers': {'Content-Type': 'application/x-www-form-urlencoded'}};


    // The function that will be executed on button click (ng-click="search()")
    $scope.search = function() {

        sdata = {};
        sdata['query'] = $scope.create_query();
        console.log("sdata:", sdata);

        sdata['facets'] = $scope.get_facets();
        console.log("sdata:", sdata);


        $scope.query_data = JSON.stringify(sdata, null, "  ");

        // Create the http post request
        // the data holds the keywords
        // The request is a JSON request.
        $http.post($scope.searchurl, data=sdata, $scope.header).
            success(function(data, status) {
                $scope.status = status;
                $scope.data = data;
                $scope.result = data; // Show result from server in our <pre></pre> element
                console.log(data);
            })
            .error(function(data, status) {
                $scope.data = data || "Request failed";
                $scope.status = status;
            });
    };


    $scope.create_query = function() {

        if ($scope.searchterm === '') {

          // empty search field
          return {"match_all": {}};

        } else {

          // create query
          q = {"query_string":
                  {"default_field": "_all",
                   "query": $scope.searchterm,
                   "default_operator": (!$scope.def_operator ? "AND" : "OR")
                  }
              };

          // check if there are some facets activated
          if (Object.keys($scope.filter_terms).length === 0) {
            return q;
          } else {
            return {"filtered": {"query": q,
                                 "filter": {"term": $scope.filter_terms}
                                }
                    };
          }
        }
    };


    $scope.set_filter_terms = function() {

      for (var facet_name in $scope.facet_collector) {
        this_name = facet_name + '_facet';
        if ($scope.facet_collector[facet_name].length !== 0) {
            $scope.filter_terms[this_name] = $scope.facet_collector[facet_name];
        } else {
            delete $scope.filter_terms[this_name];
        }

      }
    };


    $scope.update_facet_collector = function(facet, term) {

        if ($scope.facet_collector[facet].indexOf(term) > -1) {
            var index = $scope.facet_collector[facet].indexOf(term);
            $scope.facet_collector[facet].splice(index, 1);
        } else {
            $scope.facet_collector[facet].push(term);
        }
        $scope.set_filter_terms();
        $scope.search();

    };


    $scope.get_facets = function() {

        facets = {};
        myfacets = ["geos", "events", "keywords"]; //, "orgs", "persons"];
        myfacets.forEach( function(facet) {

            if ($scope.facet_collector[facet] === undefined) {
                $scope.facet_collector[facet] = [];
            }

            facets[facet] = {"terms": {"field": facet, "size": 10}};
        });
        return facets;
    };

}
