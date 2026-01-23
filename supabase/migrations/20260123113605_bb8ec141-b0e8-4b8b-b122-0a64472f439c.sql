-- Add admin role for mairh.utkarsh@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('af6274b7-53ae-4dc9-9611-b3570a1d9602', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;