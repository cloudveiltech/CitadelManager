/*
 * Copyright © 2017 Jesse Nicholson
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

///<reference path="../progresswait.ts"/>

namespace Citadel {

    /**
     *
     *
     * @class ApplyToGroupOverlay
     */
    export class ApplyAppgroupToUsergroup {
        // ───────────────────────────────────────────────────
        //   :::::: C O N S T       V A R I A B L E S ::::::
        // ───────────────────────────────────────────────────
        ERROR_MESSAGE_DELAY_TIME        = 5000;
        FADE_IN_DELAY_TIME              = 200;

        MESSAGE_LOADING                 = 'Please wait...';
        MESSAGE_ACTION_FAILED           = 'Error reported by the server during action.\n %ERROR_MSG% \nCheck console for more information.';

        TITLE_LOADING                   = 'Loading';
        TITLE_ACTION_FAILED             = 'Action Failed';

        URL_GET_APPLY_GRP_DATA          = 'api/admin/apply_appgroup_to_usergroup/data';
        URL_SELECTED_USER_GRP           = 'api/admin/apply_appgroup_to_usergroup/selected_user_group';
        URL_APPLY_APP_TO_USER           = 'api/admin/apply_appgroup_to_usergroup';
        // ───────────────────────────────────────────────────
        //   :::::: M E M B E R S    V A R I A B L E S ::::::
        // ───────────────────────────────────────────────────
        private m_arrLeftGroupData      : any[];
        private m_arrRightGroupData     : any[];
        private m_userGroups            : any[];
        private m_selectedGroups        : any[];
        private m_unselectedGroups      : any[];
        // ─────────────────────────────────────────────────────────
        //   :::::: E D I T O R   H T M L   E L E M E N T S ::::::
        // ─────────────────────────────────────────────────────────
        private m_parentDashboard       : Citadel.Dashboard;
        private m_overlay               : HTMLDivElement;
        private m_appGroupNameList      : HTMLSelectElement;

        private m_leftSelect            : HTMLSelectElement;
        private m_rightSelect           : HTMLSelectElement;

        private m_closeButton           : HTMLButtonElement;
        private m_applyButton           : HTMLButtonElement;

        private m_btnMoveRightAll       : HTMLButtonElement;
        private m_btnMoveRight          : HTMLButtonElement;
        private m_btnMoveLeft           : HTMLButtonElement;
        private m_btnMoveLeftAll        : HTMLButtonElement;
        private m_progressWait          : ProgressWait;

        constructor(dashboard) {
            this.m_parentDashboard = dashboard;
            this.ConstructUIElements();
        }

        private ConstructUIElements(): void {

            let that = this;
            this.m_overlay              = document.querySelector('#overlay_apply_app_group_to_user_group') as HTMLDivElement;
            this.m_appGroupNameList     = document.querySelector("#app_group_name_list") as HTMLSelectElement;
            this.m_leftSelect           = document.querySelector("#apply_app_group_to_user_group_source_list") as HTMLSelectElement;
            this.m_rightSelect          = document.querySelector("#apply_app_group_to_user_group_target_list") as HTMLSelectElement;

            this.m_btnMoveRightAll      = document.querySelector("#apply_app_group_to_user_group_right_all_btn") as HTMLButtonElement;
            this.m_btnMoveRight         = document.querySelector("#apply_app_group_to_user_group_right_btn") as HTMLButtonElement;
            this.m_btnMoveLeft          = document.querySelector("#apply_app_group_to_user_group_left_btn") as HTMLButtonElement;
            this.m_btnMoveLeftAll       = document.querySelector("#apply_app_group_to_user_group_left_all_btn") as HTMLButtonElement;

            this.m_arrLeftGroupData     = [];
            this.m_arrRightGroupData    = [];
            this.m_selectedGroups       = [];
            this.m_applyButton          = document.querySelector("#apply_app_group_to_user_group_appy") as HTMLButtonElement;
            this.m_closeButton          = document.querySelector('#apply_app_group_to_user_group_close') as HTMLButtonElement;

            this.m_applyButton.onclick = ((e: MouseEvent) => {
                this.onApplyButtonClicked(e);
            });

            this.m_closeButton.onclick = ((e: MouseEvent) => {
                this.Hide();
            });

            this.m_btnMoveRightAll.onclick = ((e: MouseEvent) => {
                this.onMoveRightAllClicked(e);
            });

            this.m_btnMoveRight.onclick = ((e: MouseEvent) => {
                this.onMoveRightClicked(e);
            });

            this.m_btnMoveLeft.onclick = ((e: MouseEvent) => {
                this.onMoveLeftClicked(e);
            });

            this.m_btnMoveLeftAll.onclick = ((e: MouseEvent) => {
                this.onMoveLeftAllClicked(e);
            });
            this.m_appGroupNameList.onchange = ((e: MouseEvent) => {
                this.onAppNameChanged(e);
            });
        }

        private Reset(): void {
            this.m_progressWait = new ProgressWait();

            this.m_progressWait.Show(this.TITLE_LOADING, this.MESSAGE_LOADING);
            this.m_closeButton.disabled = false;
            this._getAppliedGroupData();
        }

        private _getAppliedGroupData() {
            let ajaxSettings: JQueryAjaxSettings = {
                method: "GET",
                timeout: 60000,
                url: this.URL_GET_APPLY_GRP_DATA,
                data: {},
                success: (data: any): any => {
                    $(this.m_appGroupNameList).empty();
                    var id = 0;
                    var p = 0;
                    data.app_groups.forEach((item: any): void => {
                        p++;
                        var newOption = document.createElement("option");
                        newOption.text = item.group_name;
                        newOption.value = item.id;
                        this.m_appGroupNameList.add(newOption);
                        if (p == 1) {
                            id = item.id;
                        }
                    });
                    this.m_userGroups = data.user_groups;
                    this.loadSelectedUsergroups(id);
                    this.m_progressWait.Hide();
                    return false;
                },
                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                    this.m_progressWait.Show(this.TITLE_ACTION_FAILED, this.MESSAGE_ACTION_FAILED.replace('%ERROR_MSG', jqXHR.responseText));
                    setTimeout(() => {
                        this.m_progressWait.Hide();
                    }, this.ERROR_MESSAGE_DELAY_TIME);
                }
            }

            $.ajax(ajaxSettings);
        }

        private loadSelectedUsergroups(id: Number) {
            this.m_applyButton.disabled = true;

            $('#spiner_3').show();
            let ajaxSettings: JQueryAjaxSettings = {
                method: "GET",
                timeout: 60000,
                url: this.URL_SELECTED_USER_GRP + id,
                data: {},
                success: (data: any): any => {
                    $('#spiner_3').hide();
                    this.m_applyButton.disabled = false;
                    this.m_selectedGroups = [];
                    this.m_unselectedGroups = [];

                    data.forEach((user_group: any): void => {
                        this.m_selectedGroups.push(user_group.user_group_id);
                    });

                    this.m_userGroups.forEach((user_group: any): void => {
                        let idx = this.m_selectedGroups.indexOf(user_group.id);
                        if (idx < 0) {
                            this.m_unselectedGroups.push(user_group.id);
                        }
                    });
                    this.drawRightGroups();
                    this.drawLeftGroups();
                    this.m_progressWait.Hide();

                    return false;
                },
                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any => {
                    this.m_progressWait.Show(this.TITLE_ACTION_FAILED, this.MESSAGE_ACTION_FAILED.replace('%ERROR_MSG', jqXHR.responseText));
                    setTimeout(() => {
                        this.m_progressWait.Hide();
                    }, this.ERROR_MESSAGE_DELAY_TIME);
                }
            }

            $.ajax(ajaxSettings);
        }

        private _getUsergroupItem(app_group_id) {
            var group_item = null;
            this.m_userGroups.forEach((item: any): void => {
                if (item.id == app_group_id) {
                    group_item = item;
                    return;
                }
            });

            return group_item;
        }

        public drawLeftGroups() {
            $(this.m_leftSelect).empty();
            this.m_unselectedGroups.forEach((app_group_id): void => {
                var newOption = document.createElement("option");
                var item = this._getUsergroupItem(app_group_id);
                newOption.text = item.name;
                newOption.value = item.id;
                this.m_leftSelect.add(newOption);
            });
        }

        public drawRightGroups() {
            $(this.m_rightSelect).empty();
            this.m_selectedGroups.forEach((group_id): void => {
                var newOption = document.createElement("option");
                var item = this._getUsergroupItem(group_id);
                newOption.text = item.name;
                newOption.value = item.id;
                this.m_rightSelect.add(newOption);
            });
        }

        public onAppNameChanged(e) {
            let sel_id = parseInt(this.m_appGroupNameList.selectedOptions[0].value);
            this.loadSelectedUsergroups(sel_id);
        }

        public onMoveRightAllClicked(e: MouseEvent): void {
            this.m_unselectedGroups.forEach((group_id): void => {
                this.m_selectedGroups.push(group_id);
            });
            this.m_unselectedGroups = [];
            this.drawLeftGroups();
            this.drawRightGroups();
        }

        public onMoveLeftAllClicked(e: MouseEvent): void {
            this.m_selectedGroups.forEach((group_id): void => {
                this.m_unselectedGroups.push(group_id);
            });
            this.m_selectedGroups = [];
            this.drawLeftGroups();
            this.drawRightGroups();
        }

        public onMoveRightClicked(e: MouseEvent): void {
            if (this.m_leftSelect.selectedIndex == -1) return;
            for (var i = 0; i < this.m_leftSelect.selectedOptions.length; i++) {
                let sel_id = parseInt(this.m_leftSelect.selectedOptions[i].value);
                let sel_seq_idx = this.m_unselectedGroups.indexOf(sel_id);
                this.m_unselectedGroups.splice(sel_seq_idx, 1);
                this.m_selectedGroups.push(sel_id);
            }

            this.drawLeftGroups();
            this.drawRightGroups();
        }

        public onMoveLeftClicked(e: MouseEvent): void {
            if (this.m_rightSelect.selectedIndex == -1) return;
            for (var i = 0; i < this.m_rightSelect.selectedOptions.length; i++) {
                let sel_id = parseInt(this.m_rightSelect.selectedOptions[i].value);
                let sel_seq_idx = this.m_selectedGroups.indexOf(sel_id);
                this.m_selectedGroups.splice(sel_seq_idx, 1);
                this.m_unselectedGroups.push(sel_id);
            }

            this.drawLeftGroups();
            this.drawRightGroups();
        }

        public onApplyButtonClicked(e: MouseEvent): void {
            let url = this.URL_APPLY_APP_TO_USER;
            let sel_id = parseInt(this.m_appGroupNameList.selectedOptions[0].value);
            let dataObject = {
                app_group_id: sel_id,
                user_group_ids: this.m_selectedGroups
            };

            $('#spiner_3').show();
            let ajaxSettings: JQueryAjaxSettings = {
                method: "POST",
                timeout: 60000,
                url: url,
                data: dataObject,
                success: (data: any): any => {
                    $('#spiner_3').hide();
                    return false;
                },
                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any => {
                    this.m_progressWait.Show(this.TITLE_ACTION_FAILED, this.MESSAGE_ACTION_FAILED.replace('%ERROR_MSG', jqXHR.responseText));
                    setTimeout(() => {
                        this.m_progressWait.Hide();
                    }, this.ERROR_MESSAGE_DELAY_TIME);
                }
            }

            $.ajax(ajaxSettings);
        }

        public Show(fadeInTimeMsec: number = 200): void {
            this.Reset();
            $(this.m_overlay).fadeIn(fadeInTimeMsec);
        }

        public Hide(fadeOutTimeMsec: number = 200): void {
            this.m_parentDashboard.ForceTableRedraw(this.m_parentDashboard.m_tableAppLists);
            $(this.m_overlay).fadeOut(fadeOutTimeMsec);
        }
    }
}