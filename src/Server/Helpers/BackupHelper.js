'use strict';

const FileSystem = require('fs');
const Glob = require('glob');
const Multer = require('multer');

const MediaHelper = require('Server/Helpers/MediaHelper');
const DatabaseHelper = require('Server/Helpers/DatabaseHelper');

const Connection = require('Server/Models/Connection');

/**
 * A helper class for managing backups
 *
 * @memberof HashBrown.Server.Helpers
 */
class BackupHelper {
    /**
     * Gets config
     *
     * @returns {Promise} Storage provider settings
     */
    static getConfig() {
        return new Promise((resolve, reject) => {
            let configPath = appRoot + '/config/backup.cfg';

            FileSystem.exists(configPath, (exists) => {
                if(exists) {
                    FileSystem.readFile(configPath, (err, data) => {
                        if(err) {
                            reject(new Error('There was an error reading ' + configPath + ', please check permissions'));

                        } else {
                            try {
                                resolve(JSON.parse(data));

                            } catch(e) {
                                reject(new Error('There was a problem parsing ' + configPath));
                            
                            }
                        }
                    });
            
                } else {
                    debug.log(configPath + ' could not be found, remote backup storage services will be unavailable', this);
                    resolve();

                }
            });
        });
    }

    /**
     * Gets the upload handler
     *
     * @return {Function} handler
     */
    static getUploadHandler() {
        let handler = Multer({
            storage: Multer.diskStorage({
                destination: (req, file, resolve) => {
                    let path = appRoot + '/storage/' + req.params.project + '/dump/';
                   
                    debug.log('Handling file upload to dump storage...', this);

                    if(!FileSystem.existsSync(path)){
                        MediaHelper.mkdirRecursively(path, () => {
                            resolve(null, path);
                        });
                    
                    } else {
                        resolve(null, path);

                    }
                },
                filename: (req, file, resolve) => {
                    resolve(null, file.originalname);
                }
            })
        });
        
        return handler.single('backup');
    }
    
    /**
     * Gets a list of backups for a project
     *
     * @param {String} id
     *
     * @returns {Array} List of backup names as strings
     */
    static getBackupsForProject(id) {
        return new Promise((resolve, reject) => {
            Glob(appRoot + '/storage/' + id + '/dump/*.hba', (err, files) => {
                if(err) {
                    reject(new Error(err));
                } else {
                    for(let i in files) {
                        files[i] = files[i].replace(appRoot + '/storage/' + id + '/dump/', '').replace('.hba', '');
                    }

                    resolve(files);
                }
            });
        });
    }

    /**
     * Restores a backup for a project
     *
     * @param {String} projectName
     * @param {String} timestamp
     *
     * @returns {Promise} Promise
     */
    static restoreBackup(projectName, timestamp) {
        return DatabaseHelper.restore(projectName, timestamp);
    }
    

    /**
     * Creates a backup for a project
     *
     * @param {String} projectName
     *
     * @returns {Promise} Promise
     */
    static createBackup(projectName) {
        return DatabaseHelper.dump(projectName);
    }

    /**
     * Deletes a backup
     *
     * @param {String} projectName
     * @param {String} timestamp
     *
     * @returns {Promise} Promise
     */
    static deleteBackup(projectName, timestamp) {
        return new Promise((resolve, reject) => {
            let path = appRoot + '/storage/' + projectName + '/dump/' + timestamp + '.hba';

            if(FileSystem.existsSync(path)) {
                FileSystem.unlinkSync(path);
                resolve();

            } else {
                reject(new Error('Backup for project "' + projectName + '" width timestamp "' + timestamp + '" could not be found'));
            }
        });
    }

    /**
     * Gets the file path for a backup
     *
     * @param {String} projectName
     * @param {String} timestamp
     *
     * @returns {Promise} The backup file path
     */
    static getBackupPath(projectName, timestamp) {
        return new Promise((resolve, reject) => {
            let path = appRoot + '/storage/' + projectName + '/dump/' + timestamp + '.hba';

            if(FileSystem.existsSync(path)) {
                resolve(path);
            
            } else {
                reject(new Error('Project backup for "' + projectName + '" with timestamp "' + timestamp + '" could not be found'));
            
            }
        });
    }
}

module.exports = BackupHelper;
