var Sequence = require('immutable').Sequence;
var builders = require('ast-types').builders;

import {isNamespacedExpressionNode} from './utils/utilities';

/**
 * SpiderMonkey AST node.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
 *
 * @typedef {Object} AstNode
 * @property {string} type - A string representing the AST variant type.
 */

/**
 * AstTypes NodePath.
 *
 * @typedef {Object} NodePath
 * @property {AstNode} node - SpiderMonkey AST node.
 */

/**
 * Given the parts of a member expression flatten all occurences of it to the provided identifier.
 */
export var flattenMemberExpression = {
	/**
	 * @param {string[]} memberExpressionParts - The parts of the member expression to flatten.
	 * @param {string} replacementIdentifier - The name of the identifier to replace the flattened member expression.
	 */
	initialize(memberExpressionParts, replacementIdentifier) {
		this._memberExpressionParts = Sequence(memberExpressionParts.reverse());
		this._replacementIdentifier = builders.identifier(replacementIdentifier);
	},

	/**
	 * @param {NodePath} memberExpressionNodePath - MemberExpression NodePath.
	 */
	visitMemberExpression(memberExpressionNodePath) {
		if (isNamespacedExpressionNode(memberExpressionNodePath.node, this._memberExpressionParts)) {
			memberExpressionNodePath.replace(this._replacementIdentifier);
		}

		this.traverse(memberExpressionNodePath);
	}
}