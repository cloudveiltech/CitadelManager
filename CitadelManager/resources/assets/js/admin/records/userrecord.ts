/*
 * Copyright © 2017 Jesse Nicholson
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

///<reference path="../../progresswait.ts"/>

namespace Citadel {

    export class UserRecord extends BaseRecord {
        //
        // ────────────────────────────────────────────────────────────────────────── I ──────────
        //   :::::: U S E R   D A T A   M E M B E R S : :  :   :    :     :        :          :
        // ────────────────────────────────────────────────────────────────────────────────────
        //

        private m_userId: number;

        private m_userFullName: string;

        private m_userEmail: string;

        private m_userPassword ? : string;

        private m_groupId: number;

        private m_roleId: number;

        private m_numActivations: number;

        private m_customerId: number;
        private m_isActive: number;
        private m_reportLevel: number;
        private m_dateRegistered: string;

        //
        // ──────────────────────────────────────────────────────────────────────────────── II ──────────
        //   :::::: E D I T O R   H T M L   E L E M E N T S : :  :   :    :     :        :          :
        // ──────────────────────────────────────────────────────────────────────────────────────────
        //

        private m_mainForm: HTMLFormElement;

        /**
         * The Div of the editing overlay. This houses all of the editor
         * contents and overlays everything else with a super high z-index.
         *
         * @private
         * @type {HTMLDivElement}
         * @memberOf UserRecord
         */
        private m_editorOverlay: HTMLDivElement;

        private m_editorTitle: HTMLHeadingElement;

        private m_fullNameInput: HTMLInputElement;

        private m_emailInput: HTMLInputElement;

        private m_passwordInput: HTMLInputElement;

        private m_passwordConfirmInput: HTMLInputElement;

        private m_numActivationsInput: HTMLInputElement;

        private m_groupIdInput: HTMLSelectElement;

        private m_customerIdInput: HTMLInputElement;

        private m_roleInput: HTMLSelectElement;

        private m_isActiveInput: HTMLInputElement;

        private m_reportLevelInput: HTMLInputElement;

        private m_submitBtn: HTMLButtonElement;

        private m_cancelBtn: HTMLButtonElement;
        private jsonData: any[];
        private m_tableSettings: DataTables.Settings;
        private m_tableColumns: DataTables.ColumnSettings[];
        /**
         * User Activation DataTable.
         *
         * @private
         * @type {DataTables.Api}
         * @memberOf Dashboard
         */
        private m_ActivationTables: DataTables.Api;
        /**
         * Gets the base API route from this record type.
         *
         * @readonly
         * @type {string}
         * @memberOf GroupRecord
         */
        public get RecordRoute(): string {
            return 'api/admin/users';
        }

        protected get ValidationOptions(): JQueryValidation.ValidationOptions {
            let validationRules: JQueryValidation.RulesDictionary = {};

            validationRules[this.m_emailInput.id] = {
                required: true,
                email: true
            };

            validationRules[this.m_passwordInput.id] = {
                required: true,
                equalTo: '#' + this.m_passwordConfirmInput.id
            };

            validationRules[this.m_passwordConfirmInput.id] = {
                required: true,
                equalTo: '#' + this.m_passwordInput.id
            };

            validationRules[this.m_numActivationsInput.id] = {
                required: true,
                number: true
            };

            let validationErrorMessages = {};
            validationErrorMessages[this.m_emailInput.id] = 'A valid email address is required.';
            validationErrorMessages[this.m_passwordInput.id] = 'Password must be specified and match the password confirmation field.';
            validationErrorMessages[this.m_passwordConfirmInput.id] = 'Password confirmation must be specified and match the password field.';
            validationErrorMessages[this.m_numActivationsInput.id] = 'Total number of permitted activations must be specified.';

            let validationOptions: JQueryValidation.ValidationOptions = {
                rules: validationRules,
                errorPlacement: ((error: JQuery, element: JQuery): void => {
                    error.appendTo('#user_form_errors');
                    $('#user_form_errors').append('<br/>');
                }),
                messages: validationErrorMessages
            };

            return validationOptions;
        }

        /**
         * Creates an instance of UserRecord.
         *
         *
         * @memberOf UserRecord
         */
        constructor() {
            super();
            this.ConstructFormReferences();
        }

        private ConstructFormReferences(): void {
            this.m_mainForm = document.querySelector('#editor_user_form') as HTMLFormElement;
            this.m_editorTitle = document.querySelector('#user_editing_title') as HTMLHeadingElement;
            this.m_editorOverlay = document.querySelector('#overlay_user_editor') as HTMLDivElement;

            this.m_emailInput = document.querySelector('#editor_user_input_username') as HTMLInputElement;
            this.m_fullNameInput = document.querySelector('#editor_user_input_user_full_name') as HTMLInputElement;
            this.m_passwordInput = document.querySelector('#editor_user_input_password') as HTMLInputElement;
            this.m_passwordConfirmInput = document.querySelector('#editor_user_input_password_confirm') as HTMLInputElement;
            this.m_numActivationsInput = document.querySelector('#editor_user_input_num_activations') as HTMLInputElement;
            this.m_groupIdInput = document.querySelector('#editor_user_input_group_id') as HTMLSelectElement;
            this.m_roleInput = document.querySelector('#editor_user_input_role_id') as HTMLSelectElement;
            this.m_isActiveInput = document.querySelector('#editor_user_input_isactive') as HTMLInputElement;
            this.m_customerIdInput = document.querySelector('#editor_user_input_customer_id') as HTMLInputElement;
            this.m_reportLevelInput = document.querySelector('#editor_user_report_level') as HTMLInputElement;
            this.m_submitBtn = document.querySelector('#user_editor_submit') as HTMLButtonElement;
            this.m_cancelBtn = document.querySelector('#user_editor_cancel') as HTMLButtonElement;

            this.InitButtonHandlers();
        }

        /**
         * Called when user-activation-table is initialized
         *
         * @private
         *
         * @memberOf UserRecord
         */
        private InitUserActivationTables() {
            let that = this;
            let id = this.m_userId === undefined ? 0 : this.m_userId;

            this.m_tableColumns = [{
                title: 'Action Id',
                data: 'id',
                visible: false
            }, {
                title: 'Identifier',
                data: 'identifier',
                visible: true,
            }, {
                title: 'Device Id',
                data: 'device_id',
                visible: true,
                width: '300px'
            }, {
                title: 'App Version',
                data: 'app_version',
                visible: true,
                width: '180px'
            }, {
                title: 'IP Address',
                data: 'ip_address',
                visible: true,
                width: '200px'
            }, {
                title: 'Updated date',
                data: 'updated_at',
                visible: true,
                width: "280px"
            }, {
                title: 'Check-in Days',
                data: 'check_in_days',
                visible: true,
                width: "100px",
                render: ((data: any, t: string, row: any, meta: DataTables.CellMetaSettings): any => {
                    return "<input type='number' min='0' data-id='" + row.id + "' value='" + data + "' class='check-in-days' />";
                })
            }, {
                title: 'Alert Partner',
                data: 'alert_partner',
                visible: true,
                width: "100px",
                render: ((data: any, t: string, row: any, meta: DataTables.CellMetaSettings): any => {
                    var chk_report = (data === 1) ? "checked" : "";
                    var str = "<label class='switch-original'><input type='checkbox' data-id='" + row.id + "' " + chk_report + " /><span class='check'></span></label>";
                    return str;

                })
            }, {
                width: "300px",
                render: function (data, type, row) {
                    return "<button id='delete_" + row.id + "' class='btn-delete button primary'>Delete</button> <button id='block_" + row.id + "' class='btn-block button primary'>Block</button>";
                }
            }];

            // Define user table settings, ENSURE TO INCLUDE AJAX SETTINGS!
            this.m_tableSettings = {
                autoWidth: true,
                stateSave: true,
                responsive: true,
                columns: this.m_tableColumns,
                data: this.jsonData,
                destroy: true,
                rowCallback: ((row: Node, data: any[] | Object): void => {
                    //this.OnTableRowCreated(row, data);
                }),
                drawCallback: ((settings): void => {
                    let that = this;
                    $("#user_activation_table").off("change", "input[type='checkbox']");
                    $("#user_activation_table").on("change", "input[type='checkbox']", function () {
                        let id = $(this).attr("data-id");
                        let val = 0;
                        var objCheck = < HTMLInputElement > this;
                        if (objCheck.checked) {
                            val = 1;
                        }
                        let checkAjaxSettings: JQuery.UrlAjaxSettings = {
                            method: "POST",
                            timeout: 60000,
                            url: "api/admin/activations/update_alert",
                            data: {
                                id: id,
                                value: val
                            },
                            success: (data: any, textStatus: string, jqXHR: JQueryXHR): any => {
                                return false;
                            },
                            error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any => {
                                console.log(errorThrown);
                            }
                        }

                        $.post(checkAjaxSettings);
                    });

                    $("#user_activation_table").off("blur", "input[type='number']");
                    $("#user_activation_table").on("blur", "input[type='number']", function () {
                        let id = $(this).attr("data-id");
                        var objInput = < HTMLInputElement > this;
                        let val = objInput.value;

                        let checkAjaxSettings: JQuery.UrlAjaxSettings = {
                            method: "POST",
                            timeout: 60000,
                            url: "api/admin/activations/update_check_in_days",
                            data: {
                                id: id,
                                value: val
                            },
                            success: (data: any, textStatus: string, jqXHR: JQueryXHR): any => {
                                //that.ForceTableRedraw(that.m_tableUsers);
                                return false;
                            },
                            error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any => {
                                console.log(errorThrown);
                            }
                        }

                        $.post(checkAjaxSettings);
                    });

                    $("#user_activation_table").off("click", "button.btn-delete");
                    $("#user_activation_table").on('click', 'button.btn-delete', function (e) {
                        e.preventDefault();
                        if (confirm("Are you sure you want to delete this activation?")) {
                            let dataObject = {};
                            let id_str = e.target.id;
                            let id = id_str.split("_")[1];
                            let ajaxSettings: JQuery.UrlAjaxSettings = {
                                method: "POST",
                                timeout: 60000,
                                url: 'api/admin/user_activations/delete/' + id,
                                data: dataObject,
                                // Callback if the call was a success.
                                success: (data: any, textStatus: string, jqXHR: JQueryXHR): any => {
                                    var index = -1;
                                    for (var i = 0; i < that.jsonData.length; i++) {
                                        if (that.jsonData[i].id == id) {
                                            index = i;
                                            break;
                                        }
                                    }
                                    that.jsonData.splice(i, 1);
                                    that.InitUserActivationTables();
                                    return false;
                                },

                                // Callback if the call was a failure.
                                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any => {
                                    that.m_progressWait.Show('Action Failed', 'Error reported by the server during action.\n' + jqXHR.responseText + '\nCheck console for more information.');
                                    setTimeout(() => {
                                        that.m_progressWait.Hide();
                                    }, 5000);
                                }
                            }
                            // POST the auth request.
                            $.post(ajaxSettings);
                        }
                    });

                    $("#user_activation_table").off("click", "button.btn-block");
                    $("#user_activation_table").on('click', 'button.btn-block', function (e) {
                        e.preventDefault();
                        if (confirm("Are you sure you want to delete this activation and block the token?  The user will need to sign in again.")) {

                            let dataObject = {};
                            let id_str = e.target.id;
                            let id = id_str.split("_")[1];
                            let ajaxSettings: JQuery.UrlAjaxSettings = {
                                method: "POST",
                                timeout: 60000,
                                url: 'api/admin/user_activations/block/' + id,
                                data: dataObject,
                                // Callback if the call was a success.
                                success: (data: any, textStatus: string, jqXHR: JQueryXHR): any => {

                                    var index = -1;
                                    for (var i = 0; i < that.jsonData.length; i++) {
                                        if (that.jsonData[i].id == id) {
                                            index = i;
                                            break;
                                        }
                                    }
                                    that.jsonData.splice(i, 1);
                                    that.InitUserActivationTables();
                                    return false;
                                },

                                // Callback if the call was a failure.
                                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any => {

                                    that.m_progressWait.Show('Action Failed', 'Error reported by the server during action.\n' + jqXHR.responseText + '\nCheck console for more information.');
                                    setTimeout(() => {
                                        that.m_progressWait.Hide();
                                    }, 5000);
                                }
                            }

                            // POST the auth request.
                            $.post(ajaxSettings);
                        }
                    });
                })
            };

            this.m_ActivationTables = $('#user_activation_table').DataTable(this.m_tableSettings);
            if (id == 0) {
                this.m_ActivationTables.clear().draw();
            }
        }

        /**
         * Called when UserRecord was initialized
         *
         * @private
         *
         * @memberOf UserRecord
         */
        private InitButtonHandlers(): void {
            this.m_cancelBtn.onclick = ((e: MouseEvent): any => {
                if (this.m_actionCompleteCallback != null) {
                    this.m_actionCompleteCallback("Cancel");
                } else {
                    this.StopEditing();
                }
            });
        }

        protected LoadFromObject(data: Object): void {
            this.m_userId = data['id'] as number;
            this.m_userFullName = data['name'] as string;
            this.m_userEmail = data['email'] as string;
            this.m_userPassword = data['password'] as string;
            this.m_groupId = data['group_id'] as number;
            this.m_customerId = data['customer_id'] as number;
            this.m_roleId = data['roles'][0]['id'];
            this.m_numActivations = data['activations_allowed'];
            this.m_isActive = data['isactive'];
            this.m_dateRegistered = data['dt'] as string;
            this.m_reportLevel = data['report_level'] as number;
            this.jsonData = data['activations'];
        }

        protected LoadFromForm(): void {
            this.m_userFullName = this.m_fullNameInput.value;
            this.m_userEmail = this.m_emailInput.value;
            this.m_userPassword = this.m_passwordInput.value;
            this.m_groupId = -1;
            this.m_roleId = -1;

            // Check if a group has been selected and update our value to match it.
            if (this.m_groupIdInput.selectedIndex != -1) {
                let selectedGroupOption = this.m_groupIdInput.options[this.m_groupIdInput.selectedIndex] as HTMLOptionElement;
                this.m_groupId = parseInt(selectedGroupOption.value);
            }

            // Check if a role has been assigned and update our value to match it.
            if (this.m_roleInput.selectedIndex != -1) {
                let selectedRoleOption = this.m_roleInput.options[this.m_roleInput.selectedIndex] as HTMLOptionElement;
                this.m_roleId = parseInt(selectedRoleOption.value);
            }
            if (this.m_customerIdInput.value == "") {
                this.m_customerId = null;
            } else {
                this.m_customerId = this.m_customerIdInput.valueAsNumber;
            }
            this.m_numActivations = this.m_numActivationsInput.valueAsNumber;
            this.m_isActive = this.m_isActiveInput.checked == true ? 1 : 0;
            this.m_reportLevel = this.m_reportLevelInput.checked == true ? 1 : 0;
        }

        public StartEditing(allGroups, userData: Object = null): void {
            // Clear any existing options.
            if (this.m_groupIdInput.options != null) {
                this.m_groupIdInput.options.length = 0;
            }

            // Populate group options with what we have available.
            for (var elm of allGroups) {
                var option = document.createElement('option') as HTMLOptionElement;
                option.text = elm['name'];
                option.value = elm['id'];
                this.m_groupIdInput.options.add(option, null);
            }

            switch (userData == null) {
                case true:
                    {
                        // Creating a new object here.

                        this.m_editorTitle.innerText = "Create New User";
                        this.m_submitBtn.innerText = "Create User";

                        this.m_mainForm.reset();

                        // Default to no group set.
                        if (this.m_groupIdInput.options != null && this.m_groupIdInput.options.length > 0) {
                            this.m_groupIdInput.selectedIndex = 0;
                        } else {
                            this.m_groupIdInput.selectedIndex = -1;
                        }

                        if (this.m_roleInput.options != null && this.m_roleInput.options.length > 0) {
                            this.m_roleInput.selectedIndex = 0;
                        } else {
                            this.m_roleInput.selectedIndex = -1;
                        }
                    }
                    break;

                case false:
                    {
                        // Editing an existing object here.
                        this.LoadFromObject(userData);

                        this.m_editorTitle.innerText = "Edit User";
                        this.m_submitBtn.innerText = "Save";

                        this.m_fullNameInput.value = this.m_userFullName;
                        this.m_emailInput.value = this.m_userEmail;
                        if (this.m_customerId == null) {
                            this.m_customerIdInput.value = "";
                        } else {
                            this.m_customerIdInput.value = this.m_customerId.toString();
                        }
                        // When editing a user, we don't allow password editing. That needs to be done through
                        // the password reset system. The server will ignore the password field on updates
                        // made here, so we just fill them with nonsense to pass form validation.
                        this.m_passwordInput.value = new Array(30).join("x");
                        this.m_passwordConfirmInput.value = new Array(30).join("x");

                        this.m_numActivationsInput.value = this.m_numActivations.toString();

                        if (this.m_groupId != -1) {
                            // If we have an assigned group, find its corresponding option in the select list
                            // and then set the current index to it.
                            let optionInList = this.m_groupIdInput.querySelector('option[value="' + this.m_groupId.toString() + '"]') as HTMLOptionElement;
                            if (optionInList != null) {
                                this.m_groupIdInput.selectedIndex = optionInList.index;
                            }
                        } else {
                            // Default to no group set.
                            if (this.m_groupIdInput.options != null && this.m_groupIdInput.options.length > 0) {
                                this.m_groupIdInput.selectedIndex = 0;
                            } else {
                                this.m_groupIdInput.selectedIndex = -1;
                            }
                        }

                        if (this.m_roleId != -1) {
                            // If we have an assigned role, find its corresponding option in the select list
                            // and then set the current index to it.
                            let optionInList = this.m_roleInput.querySelector('option[value="' + this.m_roleId.toString() + '"]') as HTMLOptionElement;
                            if (optionInList != null) {
                                this.m_roleInput.selectedIndex = optionInList.index;
                            }
                        } else {
                            if (this.m_roleInput.options != null && this.m_roleInput.options.length > 0) {
                                this.m_roleInput.selectedIndex = 0;
                            } else {
                                this.m_roleInput.selectedIndex = -1;
                            }
                        }

                        this.m_isActiveInput.checked = this.m_isActive != 0;
                        this.m_reportLevelInput.checked = this.m_reportLevel != 0;
                    }
                    break;
            }

            this.m_mainForm.onsubmit = ((e: Event): any => {

                let validateOpts = this.ValidationOptions;
                let validresult = $(this.m_mainForm).validate(validateOpts).form();

                if ($(this.m_mainForm).validate(validateOpts).valid()) {
                    return this.OnFormSubmitClicked(e, userData == null);
                }

                return false;
            });

            if (userData != null) {
                this.m_userId = userData['id'];
                this.InitUserActivationTables();

            } else {
                this.m_userId = undefined;
                this.InitUserActivationTables();

            }
            // Show the editor.
            $(this.m_editorOverlay).fadeIn(250);
        }

        public StopEditing(): void {
            $(this.m_editorOverlay).fadeOut(200);
        }

        public ToObject(): Object {
            let obj = {
                'id': this.m_userId,
                'name': this.m_userFullName,
                'email': this.m_userEmail,
                'group_id': this.m_groupId,
                'role_id': this.m_roleId,
                'customer_id': this.m_customerId,
                'activations_allowed': this.m_numActivations,
                'isactive': this.m_isActive,
                'dt': this.m_dateRegistered,
                'report_level': this.m_reportLevel,
            };
            // Only add these params when the passwords are not
            // equal to our dummy insert text.
            if (this.m_userPassword != null && this.m_userPassword.length > 0 && (this.m_userPassword != Array(30).join("x"))) {
                obj['password'] = this.m_userPassword;
                obj['password_verify'] = this.m_passwordConfirmInput.value;
            }

            return obj;
        }
    }
}