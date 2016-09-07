'use strict';

let crypto = require('crypto');

let Entity = require('../../common/models/Entity');

class Password extends Entity {
    structure() {
        this.def(String, 'hash');
        this.def(String, 'salt');
    }
}

class User extends Entity {
    constructor(params) {
        if(params && params.password) {
            // Ensure correct object type
            params.password = new Password({
                hash: params.password.hash,
                salt: params.password.salt
            });
        }

        super(params);

        if(UserHelper.current) {
            this.isCurrent = UserHelper.current.id == this.id;
        }
    }
    
    structure() {
        this.def(String, 'id');
        this.def(Boolean, 'isAdmin', false);
        this.def(Boolean, 'isCurrent', false);
        this.def(String, 'username');
        this.def(String, 'fullName');
        this.def(Password, 'password', new Password());
        this.def(Array, 'tokens', []);
        this.def(Object, 'scopes', {});
    }
    
    /**
     * Sets all project scopes
     *
     * @param {String} project
     * @param {Array} scopes
     */
    setScopes(project, scopes) {
        if(!this.scopes[project]) {
            this.scopes[project] = [];
        }

        this.scopes[project] = scopes;
    }
    
    /**
     * Gets all project scopes
     *
     * @param {String} project
     *
     * @returns {Array} scopes
     */
    getScopes(project) {
        if(!this.scopes[project]) {
            this.scopes[project] = [];
        }

        return this.scopes[project];
    }

    /**
     * Checks if a user has a project scope
     *
     * @param {String} project
     * @param {String} scope
     *
     * @returns {Boolean} hasScope
     */
    hasScope(project, scope) {
        if(!this.scopes[project]) {
            this.scopes[project] = [];
        }

        return this.scopes[project].indexOf(scope) > -1;
    }

    /**
     * Creates a new access token
     */
    generateToken(params) {
        let key = crypto.randomBytes(20).toString('hex');
        let validDuration =
            8 * // Hours
            60 * // Minutes
            60 * // Seconds
            1000; // Milliseconds

        let expires = Date.now() + validDuration;
        
        let token = {
            key: key,
            expires: expires
        };

        this.cleanUpTokens();
        
        this.tokens.push(token);

        return key;
    }

    /**
     * Validate token
     *
     * @param {String} token
     *
     * @returns {Boolean} valid
     */
    validateToken(token) {
        for(let i = this.tokens.length - 1; i >= 0; i--) {
            let existingToken = this.tokens[i];
            let isExpired = existingToken.expires < Date.now();
                
            if(isExpired) {
                this.tokens.splice(i, 1);
            } else if(existingToken.key == token) {
                return true;
            }
        }

        return false;
    }

    /**
     * Cleans up expired tokens
     */
    cleanUpTokens() {
        for(let i = this.tokens.length - 1; i >= 0; i--) {
            let existingToken = this.tokens[i];
            let isExpired = existingToken.expires < Date.now();
            
            if(isExpired) {
                this.tokens.splice(i, 1);
            }
        }
    }

    /**
     * Validate password
     *
     * @param {String} password
     *
     * @returns {Boolean} valid
     */
    validatePassword(password) {
        let hashedPassword = User.sha512(password, this.password.salt);

        return this.password.hash == hashedPassword;
    }

    /**
     * Creates a sha512 hash
     *
     * @param {String} string
     * @param {String} salt
     *
     * @returns {String} hash
     */
    static sha512(string, salt) {
        let hash = crypto.createHmac('sha512', salt);

        hash.update(string);

        let value = hash.digest('hex');

        return value;
    }

    /**
     * Creates a new user object
     *
     * @param {String} username
     * @param {String} password
     *
     * @returns {User} user
     */
    static create(username, password) {
        let salt = crypto.randomBytes(128).toString('hex');
        let hashedPassword = User.sha512(password, salt);
        
        let user = new User({
            id: Entity.createId(),
            username: username,
            password: {
                hash: hashedPassword,
                salt: salt
            }
        });

        return user;
    }
}

module.exports = User;
