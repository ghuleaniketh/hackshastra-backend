import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import * as adminEventService from '../services/adminEvent.service.js';
import * as adminBlogService from '../services/adminBlog.service.js';
import * as adminProjectService from '../services/adminProject.service.js';
import * as adminContactService from '../services/adminContact.service.js';
import * as adminContentService from '../services/adminContent.service.js';

// --- Event Management ---
export const getAdminEvents = asyncHandler(async (req, res) => {
  const data = await adminEventService.getAllEvents(req.query);
  return ApiResponse.success(res, 'Admin events retrieved successfully', data, 200);
});

export const createAdminEvent = asyncHandler(async (req, res) => {
  const event = await adminEventService.createEvent(req.body);
  return ApiResponse.success(res, 'Event created successfully', event, 201);
});

export const updateAdminEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await adminEventService.updateEvent(id, req.body);
  return ApiResponse.success(res, 'Event updated successfully', event, 200);
});

export const deleteAdminEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await adminEventService.deleteEvent(id);
  return ApiResponse.success(res, 'Event deleted successfully', null, 200);
});

export const getAdminEventRegistrations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await adminEventService.getEventRegistrations(id, req.query);
  return ApiResponse.success(res, 'Event registrations retrieved successfully', data, 200);
});

// --- Blog Management ---
export const getAdminBlogs = asyncHandler(async (req, res) => {
  const data = await adminBlogService.getAllBlogs(req.query);
  return ApiResponse.success(res, 'Admin blogs retrieved successfully', data, 200);
});

export const createAdminBlog = asyncHandler(async (req, res) => {
  const blog = await adminBlogService.createBlog(req.body);
  return ApiResponse.success(res, 'Blog created successfully', blog, 201);
});

export const updateAdminBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await adminBlogService.updateBlog(id, req.body);
  return ApiResponse.success(res, 'Blog updated successfully', blog, 200);
});

export const deleteAdminBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await adminBlogService.deleteBlog(id);
  return ApiResponse.success(res, 'Blog deleted successfully', null, 200);
});

// --- Project Moderation ---
export const getAdminProjects = asyncHandler(async (req, res) => {
  const data = await adminProjectService.getAllProjects(req.query);
  return ApiResponse.success(res, 'Admin projects retrieved successfully', data, 200);
});

export const updateAdminProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await adminProjectService.updateProjectStatus(id, req.body);
  return ApiResponse.success(res, 'Project updated successfully', project, 200);
});

export const deleteAdminProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await adminProjectService.deleteProject(id);
  return ApiResponse.success(res, 'Project deleted successfully', null, 200);
});

// --- Contact Management ---
export const getAdminContactRequests = asyncHandler(async (req, res) => {
  const data = await adminContactService.getAllContactRequests(req.query);
  return ApiResponse.success(res, 'Contact requests retrieved successfully', data, 200);
});

export const updateAdminContactStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const contact = await adminContactService.updateContactStatus(id, status);
  return ApiResponse.success(res, 'Contact request status updated successfully', contact, 200);
});

// --- No-Code Website Content Management ---
export const getAdminSiteContents = asyncHandler(async (req, res) => {
  const contents = await adminContentService.getAllSiteContents();
  return ApiResponse.success(res, 'Site contents retrieved successfully', contents, 200);
});

export const getAdminSiteContentByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const content = await adminContentService.getSiteContentByKey(key);
  if (!content) {
    return ApiResponse.error(res, 'Site content section not found', 404);
  }
  return ApiResponse.success(res, 'Site content section retrieved successfully', content, 200);
});

export const updateAdminSiteContent = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const content = await adminContentService.updateSiteContent(key, req.body, req.user?.id);
  return ApiResponse.success(res, 'Site content updated successfully', content, 200);
});
