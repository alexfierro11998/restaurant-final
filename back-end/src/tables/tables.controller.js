const service = require("./tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const {sortFunction} = require("../utils/sortFunction");
//lists out all tables and sorts them by number 
async function list(req, res) {
    const response = await service.list();
    const formattedResponse = sortFunction(response);
    res.json({ data: formattedResponse });
}

//verifies object data is present
async function validateData(req, res, next) {
	if(!req.body.data) {
		return next({ status: 400, message: "Body must include a data object" });
	}

	next();
}

//verifies keys and values of the object
async function validateBody(req, res, next) {
    if(!req.body.data.table_name || req.body.data.table_name === "") {
        return next({ status: 400, message: "'table_name' field cannot be empty" });
    }

    if(req.body.data.table_name.length < 2) {
        return next({ status: 400, message: "'table_name' field must be at least 2 characters" });
    }

    if(!req.body.data.capacity || req.body.data.capacity === "") {
        return next({ status: 400, message: "'capacity' field cannot be empty" });
    }

    if(typeof req.body.data.capacity !== "number") {
		return next({ status: 400, message: "'capacity' field must be a number" });
	}

	if(req.body.data.capacity < 1) {
		return next({ status: 400, message: "'capacity' field must be at least 1" });
	}

    next();
}

//creates table and if reservation id is present it will set the status to occupied
async function create(req, res) {
	if(req.body.data.reservation_id) {
		req.body.data.status = "occupied";
		await service.updateReservation(req.body.data.reservation_id, "seated");
	}
	else {
    	req.body.data.status = "free";
	}

    const response = await service.create(req.body.data);

    res.status(201).json({ data: response[0] });
}

//validates that a reservation id is present and then searches for that reservation by reservation id
async function validateReservationId(req, res, next) {
    const { reservation_id } = req.body.data;

	if(!reservation_id) {
		return next({ status: 400, message: `reservation_id field must be included in the body` });
	}

    const reservation = await service.readReservation(Number(reservation_id));

    if(!reservation) {
        return next({ status: 404, message: `reservation_id ${reservation_id} does not exist` });
    }

    res.locals.reservation = reservation;

    next();
}

//validates a seating request to make sure it has the appropriate status and capacity 
async function validateSeatingAndCapacity(req, res, next) {
    if(res.locals.table.status === "occupied") {
        return next({ status: 400, message: "the table you selected is currently occupied" });
    }

	if(res.locals.reservation.status === "seated") {
		return next({ status: 400, message: "the reservation you selected is already seated" });
	}

    if(res.locals.table.capacity < res.locals.reservation.people) {
        return next({ status: 400, message: `the table you selected does not have enough capacity to seat ${res.locals.reservation.people} people` });
    }

    next();
}

//seats a table
async function update(req, res) {
    await service.occupy(res.locals.table.table_id, res.locals.reservation.reservation_id);
	await service.updateReservation(res.locals.reservation.reservation_id, "seated");

    res.status(200).json({ data: { status: "seated" } });
}

//verifies, searches and stores table as local variable
async function validateTableId(req, res, next) {
    const { table_id } = req.params;
    const table = await service.read(table_id);

    if(!table) {
        return next({ status: 404, message: `table id ${table_id} does not exist` });
    }

    res.locals.table = table;

    next();
}

//verifies a table is occupied before seating it
async function validateOccupiedStatus(req, res, next) {
    if(res.locals.table.status !== "occupied") {
        return next({ status: 400, message: "this table is not occupied" });
    }

    next();
}

//finishes up a table
async function destroy(req, res) {
	await service.updateReservation(res.locals.table.reservation_id, "finished");
    await service.free(res.locals.table.table_id);
	
    res.status(200).json({ data: { status: "finished" } });
}

module.exports = {
	list: asyncErrorBoundary(list),
    create: [asyncErrorBoundary(validateData), asyncErrorBoundary(validateBody), asyncErrorBoundary(create)],
    update: [asyncErrorBoundary(validateData), asyncErrorBoundary(validateTableId), asyncErrorBoundary(validateReservationId), asyncErrorBoundary(validateSeatingAndCapacity), asyncErrorBoundary(update)],
    destroy: [asyncErrorBoundary(validateTableId), asyncErrorBoundary(validateOccupiedStatus), asyncErrorBoundary(destroy)],
};