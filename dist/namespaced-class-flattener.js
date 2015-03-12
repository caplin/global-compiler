"use strict";

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

Object.defineProperty(exports, "__esModule", {
	value: true
});

var types = require("recast").types;

var List = require("immutable").List;

var isNamespacedExpressionNode = require("./utils/utilities").isNamespacedExpressionNode;

var _types$namedTypes = types.namedTypes;
var MemberExpression = _types$namedTypes.MemberExpression;
var FunctionExpression = _types$namedTypes.FunctionExpression;
var AssignmentExpression = _types$namedTypes.AssignmentExpression;
var _types$builders = types.builders;
var identifier = _types$builders.identifier;
var functionDeclaration = _types$builders.functionDeclaration;

/**
 * Flattens all Expression trees that match the provided fully qualified class name. They will be
 * transformed to simple Identifiers with the class name as their value.
 *
 * This transform works by identifying class name expressions such as.
 *
 * my.name.space.MyClass = function(){};
 *
 * my.name.space.MyClass.protoype.myMethod = function(){};
 * 
 * And flattening them to
 *
 * function MyClass(){};
 *
 * MyClass.protoype.myMethod = function(){};
 */
var namespacedClassFlattenerVisitor = {
	/**
  * @param {string} fullyQualifiedName The fully qualified class name
  */
	initialize: function initialize(fullyQualifiedName) {
		var nameParts = fullyQualifiedName.split(".").reverse();

		this._namespaceList = List.of.apply(List, _toConsumableArray(nameParts));
		this._className = this._namespaceList.first();
	},

	/**
  * @param {NodePath} identifierNodePath Identifier NodePath
  */
	visitIdentifier: function visitIdentifier(identifierNodePath) {
		var parent = identifierNodePath.parent;

		if (isClassNamespaceLeaf(identifierNodePath, parent, this._namespaceList)) {
			replaceClassNamespaceWithIdentifier(parent, identifierNodePath.node, this._className);
		}

		this.traverse(identifierNodePath);
	}
};

exports.namespacedClassFlattenerVisitor = namespacedClassFlattenerVisitor;
/**
 * Checks if identifier is the leaf of class namespaced expression. The leaf being the class name.
 *
 * @param {NodePath}     identifierNodePath       Identifier NodePath
 * @param {NodePath}     identifierParentNodePath Identifier parent NodePath
 * @param {List<string>} namespaceList            Fully qualified class name iterable
 * @returns {boolean} true if identifier is root of a class namespaced expression
 */
function isClassNamespaceLeaf(identifierNodePath, identifierParentNodePath, namespaceList) {
	// Is the identifier being tested the class name identifier i.e. `MyClass`
	var isClassNamespaceLeaf = identifierParentNodePath.get("property") === identifierNodePath;
	var isClassNamespace = isNamespacedExpressionNode(identifierParentNodePath.node, namespaceList);

	return isClassNamespace && isClassNamespaceLeaf;
}

/**
 * @param {NodePath} namespacedClassNodePath Leaf of the fully qualified namespaced NodePath
 * @param {AstNode}  classNameIdentifierNode Identifier AstNode
 * @param {string}   className               The class name
 */
function replaceClassNamespaceWithIdentifier(namespacedClassNodePath, classNameIdentifierNode, className) {
	var grandParent = namespacedClassNodePath.parent;

	// Is the namespaced expression a class constructor
	if (AssignmentExpression.check(grandParent.node) && FunctionExpression.check(grandParent.node.right)) {
		var constructorFunctionDeclaration = createConstructorFunctionDeclaration(grandParent.node, className);

		// Move the constructor comments onto the function declaration that replaces it
		constructorFunctionDeclaration.comments = grandParent.parent.node.comments;
		grandParent.parent.replace(constructorFunctionDeclaration);
	} else if (MemberExpression.check(namespacedClassNodePath.node)) {
		namespacedClassNodePath.replace(classNameIdentifierNode);
	} else {
		console.log("Namespaced expression not transformed, grandparent node type ::", grandParent.node.type);
	}
}

/**
 * Given a class constructor AssignmentExpression AstNode create a FunctionDeclaration class constructor.
 *
 * @param {AstNode} assignmentExpression AssignmentExpression AstNode
 * @param {string}  className            The class name
 */
function createConstructorFunctionDeclaration(assignmentExpression, className) {
	var functionExpression = assignmentExpression.right;

	var classConstructorDeclaration = functionDeclaration(identifier(className), functionExpression.params, functionExpression.body);

	return classConstructorDeclaration;
}