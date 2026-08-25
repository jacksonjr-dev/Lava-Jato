REVOKE EXECUTE ON FUNCTION public.current_tenant() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role_in_tenant() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_role_in_tenant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated;