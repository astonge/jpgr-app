$(function() {
	var dialog, form;

	var id;
	var title;
	var desc;

	function editImg() {
		var editId = $("#edit-id").val();
		var editTitle = $("#edit-title").val();
		var editDesc = $("#edit-desc").val();
		var data = {};
		data.id			=				editId;
		data.title	=				editTitle;
		data.desc		=				editDesc;
		var editData = JSON.stringify(data);

		console.log("Submitting edit: "+editData);

		$.ajax({
			type: 'POST',
			data: editData,
			contentType: 'application/json',
			url: '/edit'
		});
		dialog.dialog("close");

		return false;
	}

	dialog = $("#edit-dialog").dialog({
		autoOpen: false,
		height:250,
		width:350,
		modal: true,
		buttons: {
			"OK": editImg,
			Cancel: function () {
				$(this).dialog("close");
			}
		}
	});

	// $("body").on("click","#edit-button", function() {
	// 	dialog.dialog("open");

	// 	id = $(this).data("id");
	// 	title = $(this).data("etitle");
	// 	desc = $(this).data('edesc');

	// 	$("#edit-id").val(id);
	// 	$("#edit-title").val(title);
	// 	$("#edit-desc").val(desc);
	// 	console.log("onClick; "+id);
	// });

	$("body").on("click", "#del-butt", function() {
		var delData = {};
		var delId;

		delId = $(this).data("id");
		console.log("Delete: "+delId);
		delData.id			=				delId;
		var delData = JSON.stringify(delData);
		console.log("Submitting deletion: "+delData);

		$.ajax({
			type: 'POST',
			data: delData,
			contentType: 'application/json',
			url: '/delete'
		});
		window.location.replace("/");
	});
});
// 2f18b912eb98a2688c907eefe34cf3f0

$('#image-edit-dialog').on('show.bs.modal', function(event) {
	var button = $(event.relatedTarget)
	var imgTitle = button.data('etitle');
	console.log(imgTitle);

	var modal = $(this);
	modal.find('.modal-body input').val(imgTitle);
});

//plugin to make any element text editable
//http://stackoverflow.com/a/13866517/2343
$.fn.extend({
	editable: function() {
			var that = this,
					$edittextbox = $('<input type="text"></input>').css('min-width', that.width()),
					submitChanges = function() {
							that.html($edittextbox.val());
							that.show();
							that.trigger('editsubmit', [that.html()]);
							$(document).unbind('click', submitChanges);
							$edittextbox.detach();
					},
					tempVal;
			$edittextbox.click(function(event) {
					event.stopPropagation();
			});

			that.dblclick(function(e) {
					tempVal = that.html();
					$edittextbox.val(tempVal).insertBefore(that).bind('keypress', function(e) {
							if ($(this).val() !== '') {
									var code = (e.keyCode ? e.keyCode : e.which);
									if (code == 13) {
											submitChanges();
									}
							}
					});
					that.hide();
					$(document).click(submitChanges);
			});
			return that;
	}
});

$('#post-title').editable().on('editsubmit',function(event, val) {
	console.log('edited: '+val);
});