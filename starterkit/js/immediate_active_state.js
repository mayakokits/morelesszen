ae_base(document).ready(function() {
	var $ = ae_base;
	var nav = $('#main-menu, .menu');
	var menuItems = $('li', nav);
	menuItems.each(function() {
		var item = $(this);
		$('a', this).click(function(obj){
			menuItems.each(function(){
				$(this).removeClass('active').removeClass('active-trail');
				$('a', this).removeClass('active').removeClass('active-trail');
			});
			item.addClass('active').addClass('active-trail');
			$(this).addClass('active').addClass('active-trail');
		});
	});
});
