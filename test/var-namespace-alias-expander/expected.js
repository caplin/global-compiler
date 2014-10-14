var INPUT_FIELDS;

var SuperClass = my.name.event.SuperClass;

my.name.space.feature.SomeClass = function() {

	var TRADE_FIELDS = my.name.space.feature.Constants.TRADE_FIELDS,
		LEG_FIELDS = my.name.space.feature.Constants.TRADE_LEG_FIELDS,
		INPUT_FIELDS = my.name.space.feature.presentation.node;

	this.isPercentageBased = this._member.get(my.name.space.feature.Constants.TRADE_FIELDS.PERCENTAGE_BASED);
	this.percentage = new my.name.space.feature.Class(this._member.getEditableProperty(my.name.space.feature.Constants.TRADE_LEG_FIELDS.PERCENTAGE));

	this.account = new my.name.space.feature.presentation.node.SpecialField(this._member.getEditableProperty(my.name.space.feature.Constants.TRADE_LEG_FIELDS.ACCOUNT));

	this.nearDate = new my.name.space.feature.node.AField(
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.NEAR_DATE),
		this._member.get(my.name.space.feature.Constants.TRADE_LEG_FIELDS.NEAR_TENOR),
		someGlobal.TRADE_FIELDS
	);

	my.name.event.SuperClass.call(this);
};

my.extend(my.name.space.feature.SomeClass, my.name.event.SuperClass);

my.name.space.feature.SomeClass.prototype.getSomeValue = function() {
	var sep = my.name.space.with.Constants.DIRECTION_SEPARATOR,
		value = this.get(this.TRADE_LEG_FIELDS.NEAR_BUY_SELL);

	if (this.get('Yo') === "Yo" && this.getNo()) {
		value = value + my.name.space.with.Constants.DIRECTION_SEPARATOR + this.getMoreGet();
	}

	return value;
};

my.name.space.feature.SomeClass.prototype.otherMethod = function() {
	var sep = my.name.space.with.OtherConstants.SEPARATOR,
		value = 10,
		value2 = my.name.space.with.SomeConstants.VALUE;

	if (this.get('Yo - Other method') === my.name.space.with.SomeConstants.VALUE && this.getNo()) {
		value = value + my.name.space.with.OtherConstants.SEPARATOR + this.getMoreGet();
	}

	return value;
};

my.name.space.feature.SomeClass.prototype.newMethod = function(sAmount) {

	my.name.event.SuperClass.prototype.newMethod.apply(this, arguments);

	var MY_CONSTANTS = my.name.space.feature.SomeClass.MY_CONSTANTS;

	var ThousandFormatter = my.name.space.AClass;
	var AmountFormatter = my.name.space.AnotherClass;

	sAmount = my.name.space.AClass.format(sAmount + my.name.space.feature.SomeClass.MY_CONSTANTS.A_VALUE, {});
	sAmount = my.name.space.AnotherClass.format(sAmount, {
		padDecimals: 'true'
	});

	return sAmount;
};

my.name.space.feature.SomeClass.prototype.method = function(value, max) {

	var FPA = my.name.Class;
	var sep = my.name.space.with.Constants.DIRECTION_SEPARATOR;

	if (value > 0 && max > 0) {

		percentage = (my.name.Class.divide(value, max, 10)) * 100;

	}

	return percentage + my.name.space.with.Constants.DIRECTION_SEPARATOR;
};

my.name.space.feature.SomeClass.MY_CONSTANTS = {
	NONE: 0,
	UP: 1,
	DOWN: 2
};
