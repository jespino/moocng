/*jslint vars: false, browser: true, nomen: true */
/*global MOOC:true, _, jQuery, Backbone, d3, nv */

// Copyright 2013 Rooter Analysis S.L.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

if (_.isUndefined(window.MOOC)) {
    window.MOOC = {};
}

(function ($, Backbone, _, d3, nv) {
    "use strict";

    var renderPie = function (viewport, labels, values, key) {
            var data = _.zip(labels, values);
            if (_.isUndefined(key)) {
                key = "";
            }
            nv.addGraph(function () {
                var chart = nv.models.pieChart()
                    .x(function (d) { return d[0]; }) // label
                    .y(function (d) { return d[1]; }) // value
                    .showLegend(true)
                    .showLabels(false);

                d3.select(viewport).append("svg")
                    .datum([{
                        key: key,
                        values: data
                    }]).transition().duration(1200)
                    .call(chart);

                nv.utils.windowResize(chart.update);
                return chart;
            });
        },

        renderBar = function (viewport, labels, values, key) {
            var data = _.zip(labels, values);
            if (_.isUndefined(key)) {
                key = "";
            }
            nv.addGraph(function () {
                var chart = nv.models.discreteBarChart()
                    .x(function (d) { return d[0]; }) // label
                    .y(function (d) { return d[1]; }) // value
                    .staggerLabels(false)
                    .tooltips(true)
                    .showValues(true);

                d3.select(viewport).append("svg")
                    .datum([{
                        key: key,
                        values: data
                    }]).transition().duration(750)
                    .call(chart);

                nv.utils.windowResize(chart.update);
                return chart;
            });
        },

        renderMultiBar = function (viewport, data) {
            nv.addGraph(function () {
                var chart = nv.models.multiBarChart();

                d3.select(viewport).append("svg")
                    .datum(data)
                    .transition().duration(750)
                    .call(chart);

                nv.utils.windowResize(chart.update);
                return chart;
            });
        },

        renderLine = function (viewport, data, yDomain, callback) {
            nv.addGraph(function () {
                var chart = nv.models.lineChart(),
                    showLegend = true;

                if (data.length === 1) {
                    showLegend = false;
                }

                chart = chart.showLegend(showLegend)
                    .yDomain(yDomain);
                chart = callback(chart);

                d3.select(viewport).append("svg")
                    .datum(data)
                    .transition().duration(750)
                    .call(chart);

                nv.utils.windowResize(chart.update);
                return chart;
            });
        };

    MOOC.views = {};

    MOOC.views.Course = Backbone.View.extend({
        events: {},

        initialize: function () {
            _.bindAll(this, "render", "destroy");
            this.template = $("#course-tpl").text();
        },

        render: function () {
            var data = this.model.getData(),
                chartData,
                aux;
            this.$el.html(this.template);

            if (!_.isUndefined(data.passed)) {
                this.$el.find("#passed").removeClass("hide");
                renderPie(
                    this.$el.find("#passed .viewport")[0],
                    [MOOC.trans.notPassed, MOOC.trans.passed],
                    [data.enrolled - data.passed, data.passed]
                );
            } else {
                // Just two pies
                this.$el.find("#started").removeClass("span3").addClass("span5");
                this.$el.find("#completed").removeClass("span3").addClass("span5");
            }

            renderPie(
                this.$el.find("#started .viewport")[0],
                [MOOC.trans.notStarted, MOOC.trans.started],
                [data.enrolled - data.started, data.started]
            );

            renderPie(
                this.$el.find("#completed .viewport")[0],
                [MOOC.trans.notCompleted, MOOC.trans.completed],
                [data.enrolled - data.completed, data.completed]
            );

            chartData = [{
                key: MOOC.trans.evolution,
                values: [
                    { x: 0, y: data.enrolled },
                    { x: 1, y: data.started },
                    { x: 2, y: data.completed },
                    { x: 3, y: data.passed }
                ]
            }];

            aux = {
                0: MOOC.trans.enrolled,
                1: MOOC.trans.started,
                2: MOOC.trans.completed,
                3: MOOC.trans.passed
            };

            renderLine(
                this.$el.find("#tendencies .viewport")[0],
                chartData,
                [0, data.enrolled],
                function (chart) {
                    chart.xAxis
                        .tickSubdivide(false)
                        .tickFormat(function (t) {
                            return aux[t];
                        });
                    return chart;
                }
            );

            chartData = [{
                key: MOOC.trans.started,
                values: []
            }, {
                key: MOOC.trans.completed,
                values: []
            }, {
                key: MOOC.trans.passed,
                values: []
            }];

            this.model.get("units").each(function (unit, idx) {
                chartData[0].values.push({
                    x: unit.get("title"),
                    y: unit.get("started")
                });
                chartData[1].values.push({
                    x: unit.get("title"),
                    y: unit.get("completed")
                });
                chartData[2].values.push({
                    x: unit.get("title"),
                    y: unit.get("passed")
                });
            });

            renderMultiBar(this.$el.find("#units .viewport")[0], chartData);
        },

        destroy: function () {
            this.$el.html("");
            // TODO
        }
    });

    MOOC.views.Unit = Backbone.View.extend({
        events: {},

        initialize: function () {
            _.bindAll(this, "render", "destroy");
            this.template = $("#unit-tpl").text();
        },

        render: function () {
            this.$el.html(this.template);
            var data = this.model.getData(),
                self = this,
                chartData,
                buttons,
                aux;

            aux = this.$el.find("#unit-title");
            aux.text(aux.text() + this.model.get("title"));

            if (!_.isUndefined(data.passed)) {
                this.$el.find("#passed").removeClass("hide");
                renderPie(
                    this.$el.find("#passed .viewport")[0],
                    [MOOC.trans.notPassed, MOOC.trans.passed],
                    [data.started - data.passed, data.passed]
                );
            } else {
                // Just one pies
                this.$el.find("#completed").removeClass("span5").addClass("span10");
            }

            renderPie(
                this.$el.find("#completed .viewport")[0],
                [MOOC.trans.notCompleted, MOOC.trans.completed],
                [data.started - data.completed, data.completed]
            );

            chartData = [{
                key: MOOC.trans.evolution,
                values: [
                    { x: 0, y: data.started },
                    { x: 1, y: data.completed },
                    { x: 2, y: data.passed }
                ]
            }];

            aux = {
                0: MOOC.trans.started,
                1: MOOC.trans.completed,
                2: MOOC.trans.passed
            };

            renderLine(
                this.$el.find("#tendencies .viewport")[0],
                chartData,
                [0, data.started],
                function (chart) {
                    chart.xAxis
                        .tickSubdivide(false)
                        .tickFormat(function (t) {
                            return aux[t];
                        });
                    return chart;
                }
            );

            chartData = [{
                key: MOOC.trans.viewed,
                values: []
            }, {
                key: MOOC.trans.answered,
                values: []
            }, {
                key: MOOC.trans.passed,
                values: []
            }];

            buttons = this.$el.find("#kq-buttons");

            this.model.get("kqs").each(function (kq, idx) {
                var title = kq.get("title");

                chartData[0].values.push({
                    x: title,
                    y: kq.get("viewed")
                });
                chartData[1].values.push({
                    x: title,
                    y: kq.get("answered")
                });
                chartData[2].values.push({
                    x: title,
                    y: kq.get("passed")
                });

                buttons.append("<a href='#unit" + self.model.get("id") + "/kq" + kq.get("id") + "' class='btn'>" + title + "</a>");
            });

            renderMultiBar(this.$el.find("#kqs .viewport")[0], chartData);
        },

        destroy: function () {
            this.$el.html("");
            // TODO
        }
    });

    MOOC.views.KnowledgeQuantum = Backbone.View.extend({
        events: {},

        initialize: function () {
            _.bindAll(this, "render", "destroy");
        },

        render: function () {
            // TODO
        },

        destroy: function () {
            // TODO
        }
    });

}(jQuery, Backbone, _, d3, nv));