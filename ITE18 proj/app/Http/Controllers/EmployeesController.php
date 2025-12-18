<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use Illuminate\Http\Request;

class EmployeesController extends Controller
{
    // GET all employees
    public function index()
    {
        return response()->json(Employees::all(), 200);
    }

    // GET single employee by ID
    public function show($id)
    {
        $employee = Employees::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        return response()->json($employee, 200);
    }

    // POST create new employee
    public function store(Request $request)
    {
        $employee = Employees::create($request->all());
        return response()->json($employee, 201);
    }

    // PUT update employee
    public function update(Request $request, $id)
    {
        $employee = Employees::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        $employee->update($request->all());
        return response()->json($employee, 200);
    }

    // DELETE employee
    public function destroy($id)
    {
        $employee = Employees::find($id);
        if (!$employee) {
            return response()->json(['message' => 'Employee not found'], 404);
        }
        $employee->delete();
        return response()->json(['message' => 'Employee deleted'], 200);
    }
}

