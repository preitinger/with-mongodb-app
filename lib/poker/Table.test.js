import {Table, updateActive} from "./Table"
import { queryAllByRole, render, screen, within, act, fireEvent } from '@testing-library/react';
// import {act, Simulate} from 'react-dom/test-utils'; // ES6
// import ReactTestUtils from 'react-dom/test-utils'; // ES6
import userEvent from '@testing-library/user-event'
import {isInaccessable, logRoles} from '@testing-library/dom'

describe("updateActive", () => {
    it("does nothing when 1 or less seats are not null", () => {
        let t = {
            id: "1",
            seats: [null, null, null, null, null],
            pot:0,
            active:0,
            dealer:0,
            board: []
        };
        const copy = {
            ...t
        };
        updateActive(t);
        expect(t).toHaveProperty("id", copy.id);
        expect(t).toEqual(copy);

    })

    it("increments active by 1 when active + 1 < seats.length and seats[active+1] != null", () => {
        let t = {
            id: "1",
            seats: [null, {name:"Peter", stock:0, bet:0}, null, null, null],
            pot:0,
            active:0,
            dealer:0,
            board: []
        };
        let copy = {
            ...t
        };
        updateActive(t);
        expect(t).toHaveProperty("id", copy.id);
        expect(t).toHaveProperty("pot", copy.pot);
        expect(t).toHaveProperty("active", copy.active + 1);
        expect(t).toHaveProperty("dealer", copy.dealer);
        expect(t.board).toEqual(copy.board);

        t = {
            id: "1",
            seats: [null, {name:"Peter", stock:0, bet:0}, {name:"Georg", stock:0, bet:0}, null, null],
            pot:0,
            active:1,
            dealer:0,
            board: []
        };
        copy = {
            ...t
        };
        updateActive(t);
        expect(t).toHaveProperty("id", copy.id);
        expect(t).toHaveProperty("pot", copy.pot);
        expect(t).toHaveProperty("active", copy.active + 1);
        expect(t).toHaveProperty("dealer", copy.dealer);
        expect(t.board).toEqual(copy.board);

    })
})