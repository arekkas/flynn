//= require ../store
//= require ../dispatcher

(function () {

"use strict";

var JobsStream = Dashboard.Stores.JobsStream = Dashboard.Store.createClass({
	displayName: "Stores.JobOutput",

	getState: function () {
		return this.state;
	},

	willInitialize: function () {
		this.props = {
			appId: this.id.appId,
		};
		this.url = Dashboard.config.endpoints.cluster_controller + "/apps/"+ this.props.appId +"/jobs?key="+ encodeURIComponent(Dashboard.config.user.controller_key);
	},

	didBecomeActive: function () {
		this.__openEventStream();
	},

	didBecomeInactive: function () {
		return this.constructor.__super__.didBecomeInactive.apply(this, arguments).then(function () {
			if (this.__eventSource) {
				this.__eventSource.close();
			}
		}.bind(this));
	},

	getInitialState: function () {
		return {};
	},

	__openEventStream: function () {
		if ( !window.hasOwnProperty('EventSource') ) {
			return;
		}

		var url = this.url;
		var eventSource;
		eventSource = new window.EventSource(url, {withCredentials: true});
		eventSource.addEventListener("close", function () {
			this.__eventSource = null;
		});
		eventSource.addEventListener("message", function (e) {
			var evnt = JSON.parse(e.data || "");
			Dashboard.Dispatcher.handleAppEvent({
				name: "JOB_STATE_CHANGE",
				appId: this.props.appId,
				jobId: evnt.job_id,
				state: evnt.state
			});
		}.bind(this), false);

		this.__eventSource = eventSource;
	}

});

JobsStream.isValidId = function (id) {
	return id.appId;
};

})();
