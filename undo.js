// NOTE: THIS SCRIPT IS NOT BEING MAINTAINED
//  mobileUndo 2.0.0, a script allowing reversion of edits on mobile.
//  All code is released under the default Wikipedia content license.
//  Installation instructions at [[User:DannyS712/Undo]].
//  <doc>  This script basically connects an API endpoint to 
//         a mw-ui-destructive button which is added to the 
//         footer by using jQuery. Additional functionality 
//         includes changing the position of the thanks button
//         and the addition of a confirm dialog to the thank button,
//         to prevent mis-clicks due to both buttons being close 
//         to each other.
//  </doc>
//<nowiki>
$(document).ready(function(){
	console.time('mobileUndo');
	if ( mw.config.get('wgCanonicalSpecialPageName') === 'MobileDiff') {
		//Page is a diff page
		//Interface construction
		mw.util.addCSS('#mw-mf-userinfo .mobileUndo-ui .mw-ui-icon.mw-ui-icon-before:before{display:none;}');
		//Thank module starts here
		if (mw.config.get('wgVisualEditor').pageLanguageDir === 'ltr') {
			$('#mw-mf-userinfo .post-content').append('<div class="mobileUndo-ui" style="display:inline-block; float:right;"></div>');
		}
		else {
			$('#mw-mf-userinfo .post-content').append('<div class="mobileUndo-ui" style="display:inline-block; float:left;"></div>');
		}
		var $thanks = $('.mw-mf-action-button').remove();
		$thanks.insertAfter('.mw-mf-edit-count');
		$thanks.css({
			'clear': 'none',
			'margin-top': '0.25em'
		})
		if (!$('.warningbox').length && mw.config.get('wgRelevantPageIsProbablyEditable')) {
			//The real music, the undo button is created
			if (mw.config.get('wgVisualEditor').pageLanguageDir === 'ltr') {
				$('.mobileUndo-ui').append('<button class=\'mw-ui-button mw-ui-destructive\'' +
					' id=\'mobileUndo\' style=\"margin-right:0.5em; margin-top:0.25em;\">' +
					'<img style="height:1.2em;" src=\"//upload.wikimedia.org/wikipedia/commons/b/ba/OOjs_UI_icon_editUndo-ltr-invert.svg\">' +
					'</img> <span id="mobileUndo-text">Undo</span></button>');
			}
			else {
				$('.mobileUndo-ui').append('<button class=\'mw-ui-button mw-ui-destructive\'' +
					' id=\'mobileUndo\' style=\"margin-left:0.5em; margin-top:0.25em;\">' +
					'<img style="height:1.2em;" src=\"//upload.wikimedia.org/wikipedia/commons/b/ba/OOjs_UI_icon_editUndo-ltr-invert.svg\">' +
					'</img> <span id="mobileUndo-text">Undo</span></button>');
			}
			console.timeEnd('mobileUndo');
		}
	}
});
if ( mw.config.get('wgCanonicalSpecialPageName') === 'MobileDiff') {
	$.when(mw.loader.using(['mediawiki.util', 'mediawiki.api', 'oojs-ui-windows'])).then(function() {
	    return new mw.Api().getMessages(['editundo', 'Undo-nochange']);
	}).then(function(globalmessages) {
		window.wgRelevantUser = function() {
		    var user;
	    	if ($('.mw-mf-user-link').text() !== '') {
	        	user = $('.mw-mf-user-link').text();
	    	} else {
	        	user = $('#mw-mf-userinfo .post-content div:nth-child(2)').text();
	    	}
		    return user;
	    };
	    window.wgRevId = ($('#mw-mf-diffarea > div.mw-mf-diff-info > h3 > a').attr('href')).split('&oldid=')[1];
	    var revId = wgRevId;
		console.log(revId);
	    var username = wgRelevantUser();
	    $('#mobileUndo-text').text(globalmessages.editundo);
	    $('#mw-mf-userinfo .post-content .mobileUndo-ui .mw-mf-action-button').click(function(e) {
	        e.preventDefault();
	        OO.ui.confirm('Send public thanks?').done(function(confirmed) {
	            if (confirmed) {
	                $('.mw-mf-action-button').prop('disabled', true).text('Thanking...');
	                var api = new mw.Api();
	                api.postWithToken('csrf', {
	                    action: "thank",
	                    rev: revId,
	                }).done(function(result) {
	                    mw.notify('You thanked ' + username + '.');
	                    $('.mw-mf-action-button').text('Thanked');
	                }).fail(function() {
	                    mw.notify('Failed to thank ' + username + '.');
	                    $('.mw-mf-action-button').text('Failed');
	                });
	            }
	        });
	    });
	    
	    $('#mobileUndo').click(function(e) {
	        e.preventDefault();
	        OO.ui.prompt('Add a reason to your edit summary!', {
	            textInput: {
	                placeholder: 'Reason...'
	            }
	        }).done(function(customEditSummary) {
				$.when(mw.loader.using('mediawiki.api')).then(function() {
					return new mw.Api().getMessages( ['undo-summary'], { amlang: mw.config.get('wgContentLanguage') } );
				}).then(function(message) {
					var editSummaryMessage = message['undo-summary'];
					var editSummary = editSummaryMessage.replace(/\$1/g,revId);
					editSummary = editSummary.replace(/\$2/g,username);
		            if (customEditSummary !== null) {
		            	document.getElementById("mobileUndo").disabled = true;
		                editSummary = editSummary + ' ' + customEditSummary + ' ([[w:en:User:DannyS712/Undo|mobileUndo]] v2.0.0)';
		                //call the API
		                var api = new mw.Api({
		                    ajax: {
		                        headers: {
		                            'Api-User-Agent': 'mobileUndo/2.0.0(https://en.wikipedia.org/wiki/User:DannyS712/Undo.js)'
		                        }
		                    }
		                });
		                //Feedback UI
		                $('#mobileUndo').text('Loading...');
		                api.postWithToken('csrf', {
		                    action: "edit",
		                    title: mw.config.get('wgRelevantPageName'),
		                    summary: editSummary,
		                    undo: revId,
		                }).done(function(result) {
		                    if (typeof result.edit.nochange !== 'undefined') {
		                        $('#mobileUndo').text('Failed');
		                        $('.mw-mf-diff-info').append('<br><div id="mobileUndo-info" style="font-size:90%; background:#FFC0CB; padding:5px; margin-top:10px;">' +
		                            globalmessages['Undo-nochange'] +
		                            ' <br><span style="font-size:85%">If this error message sounds too tech oriented,' +
		                            ' please drop a note at <a href="' + mw.util.getUrl('User talk:DannyS712') +
		                            '">DannyS712\'s talk page</a>.</span></div>'
		                        );
		                        location.href = location.href + '#mobileUndo-info';
		                        return;
		                    }
		                    $('#mobileUndo').text('Successful');
		                    mw.notify('Revert successful....Reloading in a sec');
		                    setTimeout(function() {
		                        location.href = mw.util.getUrl('Special:MobileDiff/' + result.edit.newrevid);
		                    }, 1500);
		                    console.log(result);
		                }).fail(function(code, jqxhr) {
		                    $('#mobileUndo').text('Failed');
		                    var details;
		                    if (code === 'http' && jqxhr.textStatus === 'error') {
		                        details = 'HTTP error: ' + jqxhr.xhr.status;
		                    } else if (code === 'http') {
		                        details = 'HTTP error: ' + jqxhr.textStatus;
		                    } else if (code === 'ok-but-empty') {
		                        details = 'An empty response was given the server';
		                    } else {
		                        details = jqxhr.error.info;
		                    }
		                    $('.mw-mf-diff-info').append('<br><div id="mobileUndo-info" style="font-size:90%; background:#FFC0CB; padding:5px; margin-top:10px;">' +
		                        details.charAt(0).toLowerCase() + details.slice(1) +
		                        ' <br><span style="font-size:85%">If this error message sounds too tech oriented,' +
		                        ' please drop a note at <a href="' + mw.util.getUrl('User talk:DannyS712') + '">DannyS712\'s talk page</a>.</span></div>');
		                    location.href = location.href + '#mobileUndo-info';
		                });
					}
				});
	        });
	    });
	});
}
//</nowiki>
